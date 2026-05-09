import { useState, useRef, useCallback, type ReactNode } from 'react'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TF = (value: any, name: any) => [string, string]
import {
  BarChart, Bar, LineChart, Line, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend, Cell,
} from 'recharts'
import { useWindValueProject } from '../../hooks/useWindValue'
import type { WindValueProject, WindStateAverage } from '../../lib/types'
import { exportElementToPdf } from '../../lib/exportPdf'

// ============================================================
// Constants
// ============================================================

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const HOURS = Array.from({ length: 24 }, (_, i) =>
  i === 0 ? '12am' : i < 12 ? `${i}am` : i === 12 ? '12pm' : `${i - 12}pm`)