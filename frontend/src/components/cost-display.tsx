"use client"

import { DollarSign, Mic, Brain, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CostData } from '@/lib/api'

interface CostDisplayProps {
  cost: CostData
}

export function CostDisplay({ cost }: CostDisplayProps) {
  const formatCurrency = (value: number, currency: string = 'USD') => {
    const symbol = currency === 'EUR' ? '€' : '$'
    return `${symbol}${value.toFixed(3)}`
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('it-IT').format(num)
  }

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-chart-1/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Dettaglio Costi API
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          {/* Whisper */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Mic className="h-4 w-4" />
              Whisper (Trascrizione)
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                Durata: {cost.whisper.duration_minutes.toFixed(1)} min
              </p>
              <p className="text-lg font-semibold">
                {formatCurrency(cost.whisper.cost_usd)}
              </p>
            </div>
          </div>

          {/* Claude */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Brain className="h-4 w-4" />
              Claude (Elaborazione)
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                {formatNumber(cost.claude.input_tokens)} in / {formatNumber(cost.claude.output_tokens)} out
              </p>
              <p className="text-lg font-semibold">
                {formatCurrency(cost.claude.total_cost_usd)}
              </p>
              <p className="text-xs text-muted-foreground">
                {cost.claude.model.replace('claude-', '').replace('-20250805', '')}
              </p>
            </div>
          </div>

          {/* Totale */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              Totale
            </div>
            <div className="space-y-1">
              <p className="text-lg font-semibold text-primary">
                {formatCurrency(cost.total_cost_usd)}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatCurrency(cost.total_cost_eur, 'EUR')}
              </p>
            </div>
          </div>
        </div>

        {/* Breakdown dettagliato */}
        <div className="mt-4 pt-4 border-t space-y-2">
          <p className="text-xs text-muted-foreground">
            Breakdown Claude:
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <span className="text-muted-foreground">Input:</span>
            <span className="text-right">{formatCurrency(cost.claude.input_cost_usd)}</span>
            <span className="text-muted-foreground">Output:</span>
            <span className="text-right">{formatCurrency(cost.claude.output_cost_usd)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}