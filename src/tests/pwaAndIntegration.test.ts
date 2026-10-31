import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('PWA Manifest & Service Worker Validation', () => {
  it('validates public/manifest.json compliance', () => {
    const manifestPath = path.resolve('public/manifest.json');
    expect(fs.existsSync(manifestPath)).toBe(true);

    const content = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    expect(content.name).toBe('AURUM PULSE');
    expect(content.short_name).toBe('Aurum Pulse');
    expect(content.display).toBe('standalone');
    expect(content.start_url).toBe('/');
    expect(content.theme_color).toBe('#0B1120');
    expect(content.background_color).toBe('#070A10');
    expect(Array.isArray(content.icons)).toBe(true);
    expect(content.icons.length).toBeGreaterThanOrEqual(2);

    const has192 = content.icons.some((i: any) => i.sizes === '192x192');
    const has512 = content.icons.some((i: any) => i.sizes === '512x512');
    expect(has192).toBe(true);
    expect(has512).toBe(true);
  });

  it('verifies PWA icon assets exist on disk', () => {
    expect(fs.existsSync(path.resolve('public/icons/icon.svg'))).toBe(true);
    expect(fs.existsSync(path.resolve('public/icons/icon-192.png'))).toBe(true);
    expect(fs.existsSync(path.resolve('public/icons/icon-512.png'))).toBe(true);
  });

  it('validates public/sw.js service worker implementation', () => {
    const swPath = path.resolve('public/sw.js');
    expect(fs.existsSync(swPath)).toBe(true);
    const swCode = fs.readFileSync(swPath, 'utf-8');
    expect(swCode).toContain('aurum-pulse-shell');
    expect(swCode).toContain("addEventListener('install'");
    expect(swCode).toContain("addEventListener('activate'");
    expect(swCode).toContain("addEventListener('fetch'");
  });
});

