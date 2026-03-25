const { z } = require("zod");
const { analyzeCase } = require("../controllers/analyzeCaseController");

const BodySchema = z.object({
  problemText: z.string().min(3).max(5000),
});

module.exports = async (req, res, next) => {
  try {
    const body = BodySchema.parse(req.body || {});
    const result = await analyzeCase(body.problemText);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

