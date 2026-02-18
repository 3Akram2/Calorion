import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Reminder, ReminderDocument } from './reminder.schema';

@Injectable()
export class RemindersService implements OnModuleInit {
  private readonly logger = new Logger(RemindersService.name);

  constructor(@InjectModel(Reminder.name) private readonly reminderModel: Model<ReminderDocument>) {}

  onModuleInit() {
    setInterval(() => {
      this.tick().catch((e) => this.logger.error(e?.message || e));
    }, 60_000);
  }

  async create(userId: string, body: any) {
    return this.reminderModel.create({
      userId: new Types.ObjectId(userId),
      title: body.title,
      time: body.time,
      timezone: body.timezone || 'Europe/Berlin',
      enabled: body.enabled !== false,
      ramadanOnly: !!body.ramadanOnly,
      telegramChatId: body.telegramChatId || '',
    });
  }

  async listByUser(userId: string) {
    return this.reminderModel.find({ userId: new Types.ObjectId(userId) }).sort({ createdAt: -1 }).lean();
  }

  async remove(userId: string, reminderId: string) {
    await this.reminderModel.deleteOne({ _id: reminderId, userId: new Types.ObjectId(userId) });
    return { ok: true };
  }

  async tick() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const nowHm = `${hh}:${mm}`;

    const due = await this.reminderModel.find({ enabled: true, time: nowHm });
    if (!due.length) return;

    for (const reminder of due) {
      const recentlyTriggered =
        reminder.lastTriggeredAt && now.getTime() - new Date(reminder.lastTriggeredAt).getTime() < 50 * 60 * 1000;
      if (recentlyTriggered) continue;

      await this.sendTelegramReminder(reminder.telegramChatId, `⏰ Calorion reminder: ${reminder.title}`);
      reminder.lastTriggeredAt = now;
      await reminder.save();
    }
  }

  private async sendTelegramReminder(chatId: string, text: string) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken || !chatId) return;

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
  }
}
