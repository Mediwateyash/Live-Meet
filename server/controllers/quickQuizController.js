import { generateMCQs } from '../services/aiService.js';
import { validateUrlForSsrf } from '../utils/ssrfFilter.js';

export const generateQuickQuiz = async (req, res) => {
    try {
        const { resourceUrl, numQuestions = 5, title = "Lesson Quick Quiz" } = req.body;

        if (!resourceUrl) {
            return res.status(400).json({ message: "Resource URL is required to generate a quick quiz." });
        }

        // Validate URL against SSRF
        try {
            await validateUrlForSsrf(resourceUrl);
        } catch (validationError) {
            return res.status(400).json({ message: validationError.message || "Invalid URL or restricted IP" });
        }

        const response = await fetch(resourceUrl);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch resource from URL: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const mimeType = response.headers.get('content-type') || 'application/pdf';

        // Generate MCQs using AI
        const questions = await generateMCQs({
            fileBuffer: buffer,
            mimeType: mimeType,
            numQuestions: parseInt(numQuestions),
            chapterName: title
        });

        res.status(200).json({ questions });

    } catch (error) {
        console.error('[generateQuickQuiz] Error:', error);
        res.status(500).json({ message: error.message || 'Failed to generate quick quiz' });
    }
};
