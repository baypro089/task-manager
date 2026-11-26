
export const POSITION_STEP = 1000;
export const REBALANCE_THRESHOLD = 0.001;

/**
 * Tính position khi kéo thả.
 * - prev: task sẽ nằm NGAY TRÊN (position nhỏ hơn)
 * - next: task sẽ nằm NGAY DƯỚI (position lớn hơn)
 *
 * Trả về vị trí mới. Ném RebalanceRequiredError nếu gap quá nhỏ.
 */
export class RebalanceRequiredError extends Error {
    constructor() {
        super('Position gap too small — rebalance required');
        this.name = 'RebalanceRequiredError';
    }
}

export function calculatePosition(
    prev: number | null,
    next: number | null,
): number {
    // Cột trống
    if (prev === null && next === null) return POSITION_STEP;

    // Chèn lên đầu cột (không có prev)
    if (prev === null) return next! / 2;

    // Chèn xuống cuối cột (không có next)
    if (next === null) return prev + POSITION_STEP;

    // Chèn giữa
    const gap = next - prev;
    if (gap < REBALANCE_THRESHOLD) {
        throw new RebalanceRequiredError();
    }
    return prev + gap / 2;
}

/**
 * Tính lại toàn bộ position trong cột: 1000, 2000, 3000...
 * Trả về map { taskId: newPosition } để repository bulk update.
 */
export function rebalancePositions(
    tasks: Array<{ id: string; position: number }>,
): Array<{ id: string; position: number }> {
    const sorted = [...tasks].sort((a, b) => a.position - b.position);
    return sorted.map((t, i) => ({
        id: t.id,
        position: (i + 1) * POSITION_STEP,
    }));
}