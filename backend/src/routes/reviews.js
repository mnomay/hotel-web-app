import { Router } from 'express';
import { createReview } from '../services/reviews.js';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { confirmationCode, rating, comment } = req.body ?? {};
    const review = await createReview({ confirmationCode, rating, comment });
    return res.status(201).json(review);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        message: error.message,
        code: error.code,
      });
    }

    console.error(error);
    return res.status(500).json({ message: 'Failed to create review' });
  }
});

export default router;
