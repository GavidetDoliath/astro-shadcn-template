/// <reference types="astro/client" />

import type { UserProfile } from '@/lib/auth';

declare global {
  namespace App {
    interface Locals {
      user: UserProfile | null;
    }
  }
}
