import { validateContactPayload } from '../src/world/worldLogic';

interface ReqLike {
  method?: string;
  body?: unknown;
}

interface ResLike {
  status: (code: number) => ResLike;
  json: (data: unknown) => void;
}

export async function dispatchRecruiterEmail(payload: {
  name: string;
  email: string;
  organization: string;
  roleType: string;
  message: string;
}): Promise<{ deliveredVia: 'resend' | 'logged'; id: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.RECRUITER_NOTIFY_EMAIL || 'aashishmahato02@gmail.com';
  const id = `msg_${Date.now().toString(36)}`;

  if (apiKey) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || 'Portfolio World <onboarding@resend.dev>',
        to: [toEmail],
        reply_to: payload.email,
        subject: `[3D Portfolio] ${payload.roleType || 'Inquiry'} from ${payload.name}${
          payload.organization ? ` (${payload.organization})` : ''
        }`,
        text: [
          `New recruiter / collaborator inquiry from aashishkumarmahato.com.np`,
          ``,
          `Name: ${payload.name}`,
          `Email: ${payload.email}`,
          `Organization: ${payload.organization || 'Not specified'}`,
          `Role / Topic: ${payload.roleType || 'General'}`,
          ``,
          `Message:`,
          payload.message,
        ].join('\n'),
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => 'Resend dispatch failed');
      throw new Error(`Email relay error: ${errText}`);
    }
    return { deliveredVia: 'resend', id };
  }

  console.info(
    `[Contact Dispatch ${id}] From: ${payload.name} <${payload.email}> | Org: ${payload.organization} | Role: ${payload.roleType}`,
  );
  return { deliveredVia: 'logged', id };
}

export default async function handler(req: ReqLike, res: ResLike) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {}) as Record<
    string,
    unknown
  >;

  const payload = {
    name: String(body.name ?? '').trim(),
    email: String(body.email ?? '').trim(),
    organization: String(body.organization ?? '').trim(),
    roleType: String(body.roleType ?? 'Engineering Role').trim(),
    message: String(body.message ?? '').trim(),
  };

  const validation = validateContactPayload(payload);
  if (!validation.valid) {
    return res.status(400).json({ error: 'Validation failed', errors: validation.errors });
  }

  try {
    const result = await dispatchRecruiterEmail(payload);
    return res.status(200).json({
      ok: true,
      id: result.id,
      deliveredVia: result.deliveredVia,
      recipient: 'aashishmahato02@gmail.com',
    });
  } catch (err) {
    return res.status(502).json({
      error: err instanceof Error ? err.message : 'Unable to send notification',
    });
  }
}
