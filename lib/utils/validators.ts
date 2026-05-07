import { z } from 'zod'

export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const signUpSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const priceReportSchema = z.object({
  stationId: z.string().uuid('Invalid station ID'),
  fuelType: z.enum(['gasoline', 'premium', 'diesel', 'kerosene', 'lpg']),
  reportedPrice: z
    .number()
    .min(10, 'Price seems too low')
    .max(500, 'Price seems too high'),
  evidenceUrl: z.string().url().optional().nullable(),
})

export const externalPriceReportSchema = z.object({
  station: z.object({
    externalId: z.string().min(1),
    name: z.string().min(2),
    brand: z.string().optional().nullable(),
    area: z.string().optional().nullable(),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  fuelType: z.enum(['gasoline', 'premium', 'diesel', 'kerosene', 'lpg']),
  reportedPrice: z
    .number()
    .min(10, 'Price seems too low')
    .max(500, 'Price seems too high'),
  evidenceUrl: z.string().url().optional().nullable(),
})

export const stationSchema = z.object({
  name: z.string().min(2, 'Station name must be at least 2 characters'),
  brand: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  barangay: z.string().optional().nullable(),
  city: z.string().min(2, 'City is required'),
  province: z.string().min(2, 'Province is required'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  fuelTypes: z.array(z.enum(['gasoline', 'premium', 'diesel', 'kerosene', 'lpg'])).min(1),
})

export const stationSubmissionSchema = z.object({
  name: z.string().min(2, 'Station name must be at least 2 characters'),
  brand: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().min(2, 'City is required'),
  province: z.string().min(2, 'Province is required'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  fuelTypes: z.array(z.enum(['gasoline', 'premium', 'diesel', 'kerosene', 'lpg'])).min(1, 'Select at least one fuel type'),
})

export const voteSchema = z.object({
  reportId: z.string().min(1),
  voteType: z.enum(['confirm', 'reject', 'flag']),
})

export const stationSubmissionVoteSchema = z.object({
  submissionId: z.string().min(1),
  voteType: z.enum(['legit', 'not_legit']),
})

export const systemConfigSchema = z.object({
  minConfirmations: z.number().int().min(1).max(10),
  flagThreshold: z.number().int().min(1).max(10),
  reportExpiryHours: z.number().int().min(1).max(720),
  reportCooldownHours: z.number().int().min(1).max(168),
  priceTolerancePercent: z.number().min(0).max(100),
  stalePriceDays: z.number().int().min(1).max(365),
})

export type SignInInput = z.infer<typeof signInSchema>
export type SignUpInput = z.infer<typeof signUpSchema>
export type PriceReportInput = z.infer<typeof priceReportSchema>
export type ExternalPriceReportInput = z.infer<typeof externalPriceReportSchema>
export type StationInput = z.infer<typeof stationSchema>
export type StationSubmissionInput = z.infer<typeof stationSubmissionSchema>
export type VoteInput = z.infer<typeof voteSchema>
export type StationSubmissionVoteInput = z.infer<typeof stationSubmissionVoteSchema>
export type SystemConfigInput = z.infer<typeof systemConfigSchema>
