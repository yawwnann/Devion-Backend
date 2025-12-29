"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdatePaymentMethodDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_payment_method_dto_1 = require("./create-payment-method.dto");
class UpdatePaymentMethodDto extends (0, mapped_types_1.PartialType)(create_payment_method_dto_1.CreatePaymentMethodDto) {
}
exports.UpdatePaymentMethodDto = UpdatePaymentMethodDto;
//# sourceMappingURL=update-payment-method.dto.js.map