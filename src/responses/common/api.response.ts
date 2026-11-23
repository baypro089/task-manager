// src/responses/common/api-response.ts

/** Response thành công — dùng cho hầu hết endpoint */
export interface ApiSuccessResponse<T> {
    success: true;
    data: T;
    meta?: Record<string, unknown>; // Dữ liệu bổ sung
}

/** Response lỗi — dùng khi có lỗi */
export interface ApiErrorResponse {
    success: false;
    message: string;
    code?: string; // Mã lỗi (nếu có)
    errors?: unknown[]; // Danh sách lỗi chi tiết (nếu có)
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export function ok<T>(data: T, meta?: Record<string, unknown>): ApiSuccessResponse<T> {
    return meta ? { success: true, data, meta } : { success: true, data };
}

export function fail(message: string, code?: string, errors?: unknown[]): ApiErrorResponse {
    return { success: false, message, ...(code && { code }), ...(errors && { errors }) };
}