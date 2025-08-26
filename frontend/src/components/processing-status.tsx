import { Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface ProcessingStatusProps {
  step: string
}

export function ProcessingStatus({ step }: ProcessingStatusProps) {
  return (
    <Card>
      <CardContent className="py-12">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">{step}</p>
        </div>
      </CardContent>
    </Card>
  )
}