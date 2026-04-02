import { Controller, Get, Body, Patch, UseGuards } from '@nestjs/common';
import { PreferencesService } from './preferences.service';
import { UpdatePreferenceDto } from './dto/update-preference.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';

@Controller('preferences')
@UseGuards(JwtAuthGuard)
export class PreferencesController {
  constructor(private readonly preferencesService: PreferencesService) {}

  @Get()
  getPreferences(@CurrentUser('id') userId: string) {
    return this.preferencesService.getPreferences(userId);
  }

  @Patch()
  updatePreferences(
    @CurrentUser('id') userId: string,
    @Body() updatePreferenceDto: UpdatePreferenceDto,
  ) {
    return this.preferencesService.updatePreferences(
      userId,
      updatePreferenceDto,
    );
  }
}
