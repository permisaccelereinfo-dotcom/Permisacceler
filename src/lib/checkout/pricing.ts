export const EXAM_SUPPORT_PRICE = 65;

export function calculateCheckoutTotal(
  stagePrice: number,
  examSupportPrice = EXAM_SUPPORT_PRICE
) {
  if (!Number.isFinite(stagePrice) || stagePrice < 0) {
    throw new Error("Stage price must be a positive number.");
  }

  if (!Number.isFinite(examSupportPrice) || examSupportPrice < 0) {
    throw new Error("Exam support price must be a positive number.");
  }

  return stagePrice + examSupportPrice;
}
