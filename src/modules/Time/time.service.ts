import { Injectable } from '@nestjs/common';
import * as moment from 'moment-timezone';

@Injectable()
export class TimeService {
  private readonly colombiaTimeZone = 'America/Bogota';

  getCurrentTimeInColombia(): string {
    return moment.tz(this.colombiaTimeZone).format();
  }

  convertUtcToColombia(utcDate: Date | string): string {
    const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
    return moment(date).tz(this.colombiaTimeZone).subtract(5, 'hours').format();
  }
}
