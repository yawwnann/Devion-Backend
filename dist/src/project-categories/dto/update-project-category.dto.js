"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateProjectCategoryDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_project_category_dto_1 = require("./create-project-category.dto");
class UpdateProjectCategoryDto extends (0, mapped_types_1.PartialType)(create_project_category_dto_1.CreateProjectCategoryDto) {
}
exports.UpdateProjectCategoryDto = UpdateProjectCategoryDto;
//# sourceMappingURL=update-project-category.dto.js.map