import { PageStatus } from '../enums/page-status.enum';
export declare class CreatePageDto {
    title?: string;
    icon?: string;
    cover?: string;
    status?: PageStatus;
    parentId?: string;
}
