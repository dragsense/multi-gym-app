import { Entity, Column, ManyToOne } from 'typeorm';
import { User } from '@/common/base-user/entities/user.entity';
import { GeneralBaseEntity } from '../../../../common/entities';

@Entity('refresh_tokens')
export class RefreshToken extends GeneralBaseEntity {
  @Column()
  token: string;

  @Column({ nullable: true })
  lastToken: string;

  @Column()
  expiresAt: Date;

  @Column({ default: false })
  revoked: boolean;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  isExpired(): boolean {
    return this.expiresAt < new Date();
  }

  isValid(): boolean {
    return !this.revoked && !this.isExpired();
  }
}
