import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import Joi from 'joi';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const mcqSchema = Joi.array().items(
    Joi.object({
        question: Joi.string().required(),
        options: Joi.array().items(Joi.string()).length(4).required(),
        correctAnswer: Joi.string().required(),
        explanation: Joi.string().required(),
        difficulty: Joi.string().valid('easy', 'medium', 'hard').required(),
        topic: Joi.string().required()
    })
);

const MAX_RETRIES = 3;

const cleanQuestionText = (questionText) => {
    if (!questionText) return questionText;
    let text = questionText.trim();

    const metaPrefixes = [
        /^(according to (the|this|provided|given|above|module|document|text|content|material|slide|lesson|section|passage)(s)?(\s+content|\s+text|\s+material|\s+document|\s+file)?,\s*)/i,
        /^(based on (the|this|provided|given|above|module|document|text|content|material|slide|lesson|section|passage)(s)?(\s+content|\s+text|\s+material|\s+document|\s+file)?,\s*)/i,
        /^(as (defined|stated|mentioned|described|explained|discussed|noted) in (the|this|provided|given|above|module|document|text|content|material|slide|lesson|section|passage)(s)?,\s*)/i,
        /^(in (the|this|provided|given|above|module|document|text|content|material|slide|lesson|section|passage)(s)?,\s*)/i,
        /^(per (the|this|provided|given|above|module|document|text|content|material|slide|lesson|section|passage)(s)?,\s*)/i,
        /^(from the (provided|given|above) (content|text|material|document|module|slide|passage),\s*)/i,
    ];

    for (const pattern of metaPrefixes) {
        text = text.replace(pattern, '');
    }

    text = text.replace(/(,\s*as (defined|stated|mentioned|described|explained|discussed|noted) in the (module|text|content|document|material|lesson)\??)$/i, '?');
    text = text.replace(/(,\s*according to the (module|text|content|document|material|lesson)\??)$/i, '?');
    text = text.replace(/(,\s*based on the (module|text|content|document|material|lesson)\??)$/i, '?');

    if (text.length > 0) {
        text = text.charAt(0).toUpperCase() + text.slice(1);
    }

    return text;
};

const validateAndCleanMCQs = (mcqs) => {
    // 1. Basic Joi Validation
    const { error, value } = mcqSchema.validate(mcqs, { stripUnknown: true });
    if (error) {
        throw new Error(`AI Output Validation Failed: ${error.message}`);
    }

    // 2. Extra checks: 
    // - Unique options
    // - Correct answer must be in options
    // - Not too long
    const cleaned = [];
    const seenQuestions = new Set();

    for (const mcq of value) {
        mcq.question = cleanQuestionText(mcq.question);
        if (seenQuestions.has(mcq.question.toLowerCase())) continue; // Deduplicate

        const uniqueOptions = new Set(mcq.options);
        if (uniqueOptions.size !== 4) continue; // Ensure 4 unique options

        if (!mcq.options.includes(mcq.correctAnswer)) {
            // Try to fix it contextually or skip
            continue;
        }

        seenQuestions.add(mcq.question.toLowerCase());
        cleaned.push(mcq);
    }

    if (cleaned.length === 0) {
        throw new Error("No valid MCQs generated after cleaning.");
    }
    return cleaned;
};

/**
 * Generates MCQs from raw text OR multimodal file data
 */
export const generateMCQs = async ({ text = null, fileBuffer = null, mimeType = null, numQuestions = 10 }) => {
    const isMultimodal = fileBuffer && mimeType;
    
    let prompt = `
    You are an expert educator creating high-quality exam questions. Generate ${numQuestions} Multiple Choice Questions (MCQs) based strictly on the content provided.
    
    CRITICAL RULES:
    1. DIRECT & PROFESSIONAL QUESTION WRITING: Ask direct, formal exam questions (e.g. "What is a Brand?"). NEVER use meta phrases like "According to the provided text", "As defined in the module", "Based on the content", etc.
    2. EXTRACT FROM CONCEPTS: Only generate questions based on the actual educational/subject content.
    3. IGNORE METADATA: Do not generate questions about filenames, file extensions (e.g., .pptx, .pdf), slide numbers, or formatting elements.
    4. CONTEXT AWARENESS: Prioritize slide titles, headings, and key definitions.
    5. TOPIC-WISE: Group questions by the logical topics found in the material.
    6. TAGGING: For each question, provide a 'topic' (e.g., "Project Lifecycle") and a 'difficulty' (easy/medium/hard).
    7. STRUCTURE: 4 options per question. The 'correctAnswer' MUST match one of the options exactly.
    8. OUTPUT: Return ONLY a valid JSON array. No markdown, no backticks, no explanatory text outside the JSON.
    
    Structure:
    [
        {
            "question": "...",
            "options": ["A", "B", "C", "D"],
            "correctAnswer": "A",
            "explanation": "...",
            "difficulty": "medium",
            "topic": "Topic Name"
        }
    ]
    `;

    if (!isMultimodal) {
        prompt += `\nTEXT CONTENT TO ANALYZE:\n${text.substring(0, 30000)}`;
    } else {
        prompt += `\nANALYSIS INSTRUCTION: Please analyze the attached ${mimeType} file carefully. Focus on the visible text, slide content, and structural hierarchies.`;
    }

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            // As of March 2026, gemini-2.5-flash is optimized for this
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            
            let contents = [];
            if (isMultimodal) {
                contents = [
                    {
                        role: 'user',
                        parts: [
                            { text: prompt },
                            {
                                inlineData: {
                                    mimeType: mimeType,
                                    data: fileBuffer.toString('base64')
                                }
                            }
                        ]
                    }
                ];
            } else {
                contents = [{ role: 'user', parts: [{ text: prompt }] }];
            }

            const result = await model.generateContent({ contents });
            const responseText = result.response.text();

            let jsonStr = responseText.trim();
            // Cleaning markdown if AI ignores instructions
            if (jsonStr.includes('```')) {
                jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
            }

            const parsedMCQs = JSON.parse(jsonStr);
            const validMCQs = validateAndCleanMCQs(parsedMCQs);
            return validMCQs;

        } catch (error) {
            console.error(`Attempt ${attempt} failed:`, error.message);
            if (attempt === MAX_RETRIES) {
                throw new Error(`AI Generation failed after ${MAX_RETRIES} attempts: ${error.message}`);
            }
        }
    }
};
