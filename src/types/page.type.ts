export type PageResult<T> = {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    previousPage: boolean;
    nextPage: boolean;
};