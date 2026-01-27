'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function MemoryLoopSettings({ initialSettings, onSave }) {
  const [settings, setSettings] = useState({
    outcome_checks_enabled: true,
    outcome_delay_days: 7,
    insights_enabled: true,
    ...initialSettings
  })
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  
  useEffect(() => {
    if (initialSettings) {
      setSettings(prev => ({ ...prev, ...initialSettings }))
    }
  }, [initialSettings])
  
  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }
  
  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave?.(settings)
      setHasChanges(false)
      toast.success('Settings saved')
    } catch (error) {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Outcome Checks */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Outcome Checks</CardTitle>
          <CardDescription>
            Get prompted to record how decisions turned out
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="outcome-enabled">Enable outcome checks</Label>
              <p className="text-sm text-muted-foreground">
                Receive prompts to check on past decisions
              </p>
            </div>
            <Switch
              id="outcome-enabled"
              checked={settings.outcome_checks_enabled}
              onCheckedChange={(v) => updateSetting('outcome_checks_enabled', v)}
            />
          </div>
          
          {settings.outcome_checks_enabled && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Check delay</Label>
                <span className="text-sm text-muted-foreground">
                  {settings.outcome_delay_days} days after decision
                </span>
              </div>
              <Slider
                value={[settings.outcome_delay_days]}
                onValueChange={([v]) => updateSetting('outcome_delay_days', v)}
                min={3}
                max={30}
                step={1}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>3 days</span>
                <span>30 days</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Pattern Insights */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Pattern Insights</CardTitle>
          <CardDescription>
            Surface patterns between emotions, confidence, and outcomes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="insights-enabled">Enable insight surfacing</Label>
              <p className="text-sm text-muted-foreground">
                Show patterns when statistically meaningful (min 5 decisions)
              </p>
            </div>
            <Switch
              id="insights-enabled"
              checked={settings.insights_enabled}
              onCheckedChange={(v) => updateSetting('insights_enabled', v)}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Info Card */}
      <Card className="border-border/50 bg-muted/30">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            The Memory Loop helps you learn from past decisions without pressure. 
            All prompts are optional and dismissible. Patterns are only shown when 
            there's enough data to be meaningful.
          </p>
        </CardContent>
      </Card>
      
      {/* Save Button */}
      {hasChanges && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </div>
      )}
    </div>
  )
}
