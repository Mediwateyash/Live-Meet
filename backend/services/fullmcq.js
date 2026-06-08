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
    You are an expert educator. Generate ${numQuestions} high-quality Multiple Choice Questions (MCQs) based STRICTLY on the content provided.
    
    CRITICAL RULES:
    1. EXTRACT FROM CONCEPTS: Only generate questions based on the actual educational/subject content.
    2. IGNORE METADATA: Do not generate questions about filenames, file extensions (e.g., .pptx, .pdf), slide numbers, or formatting elements.
    3. CONTEXT AWARENESS: Prioritize slide titles, headings, and key definitions.
    4. TOPIC-WISE: Group questions by the logical topics found in the material.
    5. TAGGING: For each question, provide a 'topic' (e.g., "Project Lifecycle") and a 'difficulty' (easy/medium/hard).
    6. STRUCTURE: 4 options per question. The 'correctAnswer' MUST match one of the options exactly.
    7. OUTPUT: Return ONLY a valid JSON array. No markdown, no backticks, no explanatory text outside the JSON.
    
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
