import WHQuestion from '../models/WHQuestion.js';
import Material from '../models/Material.js';

export const getWHByMaterial = async (req, res) => {
    try {
        const material = await Material.findById(req.params.materialId);
        
        if (!material) {
            return res.status(404).json({ message: 'Material not found' });
        }
        
        const whQuestions = await WHQuestion.find({ materialId: req.params.materialId });
        res.json(whQuestions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteWHQuestion = async (req, res) => {
    try {
        const whQuestion = await WHQuestion.findById(req.params.id);
        if (!whQuestion) {
            return res.status(404).json({ message: 'WH Question not found' });
        }
        
        await whQuestion.deleteOne();
        res.json({ message: 'WH Question removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
