import { Injectable } from '@nestjs/common';

@Injectable()
export class RamadanService {
  async getTodayTimings(city: string, country: string) {
    const date = new Date();
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();

    const url = `https://api.aladhan.com/v1/timingsByCity/${dd}-${mm}-${yyyy}?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=5`;
    const res = await fetch(url);
    const data: any = await res.json();

    const timings = data?.data?.timings || {};
    return {
      fajr: timings.Fajr || null,
      maghrib: timings.Maghrib || null,
      source: 'aladhan',
    };
  }
}
