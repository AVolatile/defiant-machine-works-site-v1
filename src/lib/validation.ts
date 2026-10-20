import { z } from 'zod';
export const buildServices = [
  'Stippling',
  'Slide Milling',
  'Cerakote',
  'Porting',
  'Product Question',
  'Full Custom Project',
] as const;
export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name (at least 2 characters).').max(100),
  email: z.email('Enter a valid email address.').max(200),
  phone: z
    .string()
    .trim()
    .max(35)
    .refine(
      (v) =>
        !v ||
        (/^\+?[()\d\s.-]+$/.test(v) &&
          v.replace(/\D/g, '').length >= 7 &&
          v.replace(/\D/g, '').length <= 15),
      'Enter a valid phone number.',
    ),
  subject: z.string().trim().min(3, 'Choose a subject.').max(200),
  message: z
    .string()
    .trim()
    .min(15, 'Tell us a little more (at least 15 characters).')
    .max(6000, 'Keep your message under 6,000 characters.'),
  website: z.string().max(0),
});
export type ContactInput = z.infer<typeof contactSchema>;
export const buildSchema = z.object({
  service: z.enum(buildServices, { error: 'Choose a service.' }),
  manufacturer: z.string().min(1, 'Choose a manufacturer.').max(100),
  model: z.string().trim().min(1, 'Enter your model.').max(100),
  options: z.array(z.string().max(150)).max(20),
  finish: z.string().max(150),
  notes: z.string().max(3000),
  reference: z.union([
    z.literal(''),
    z
      .url('Enter a complete URL starting with https://.')
      .refine((v) => /^https?:\/\//.test(v), 'Use an http or https reference URL.'),
  ]),
  name: contactSchema.shape.name,
  email: contactSchema.shape.email,
  phone: contactSchema.shape.phone,
  preferred: z.enum(['Email', 'Phone']),
  acknowledgement: z
    .boolean()
    .refine((v) => v, 'Please acknowledge the final confirmation requirement.'),
  product: z.string().max(200).optional(),
});
export type BuildInput = Omit<z.infer<typeof buildSchema>, 'service'> & {
  service: (typeof buildServices)[number] | '';
};
// A saved draft is intentionally incomplete; final submission uses buildSchema.
export const buildDraftSchema = z.object({
  service: z.enum([...buildServices, '']).optional(),
  manufacturer: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  options: z.array(z.string().max(150)).max(20).optional(),
  finish: z.string().max(150).optional(),
  notes: z.string().max(3000).optional(),
  reference: z.string().max(2000).optional(),
  name: z.string().max(100).optional(),
  email: z.string().max(200).optional(),
  phone: z.string().max(35).optional(),
  preferred: z.enum(['Email', 'Phone']).optional(),
  product: z.string().max(200).optional(),
});
