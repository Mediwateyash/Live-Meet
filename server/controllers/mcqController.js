import MCQ from '../models/MCQ.js';
import Material from '../models/Material.js';

export const getMCQsByMaterial = async (req, res) => {
    try {
        const material = await Material.findById(req.params.materialId);
        if (!material) return res.status(404).json({ message: 'Material not found' });
        
        // Ensure teacher owns this material or is admin
        if (material.uploadedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const mcqs = await MCQ.find({ materialId: req.params.materialId });
        res.json(mcqs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateMCQ = async (req, res) => {
    try {
        const mcq = await MCQ.findById(req.params.id);
        if (!mcq) return res.status(404).json({ message: 'MCQ not found' });

        const material = await Material.findById(mcq.materialId);
        if (material.uploadedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const updatedMCQ = await MCQ.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedMCQ);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteMCQ = async (req, res) => {
    try {
        const mcq = await MCQ.findById(req.params.id);
        if (!mcq) return res.status(404).json({ message: 'MCQ not found' });

        const material = await Material.findById(mcq.materialId);
        if (material.uploadedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        await MCQ.findByIdAndDelete(req.params.id);
        res.json({ message: 'MCQ removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
