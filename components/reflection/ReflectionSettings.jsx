'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' }
]

const TONES = [
  { value: 'neutral', label: 'Neutral', description: 'Straightforward and factual' },
  { value: 'gentle', label: 'Gentle', description: 'Soft and supportive' },
  { value: 'direct', label: 'Direct', description: 'Clear and action-oriented' }
]

export function ReflectionSettings({ initialSettings, onSave }) {
  const [settings, setSettings] = useState({
    weekly_reflections_enabled: true,
    silence_nudges_enabled: true,
    capture_reminders_enabled: false,
    reflection_day: 0,
    reflection_hour: 18,
    reflection_tone: 'gentle',
    silence_threshold_days: 5,
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
  
  const formatHour = (hour) => {
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const h = hour % 12 || 12
    return `${h}:00 ${ampm}`
  }
  
  return (
    <div className="space-y-6">
      {/* Weekly Reflections */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Weekly Reflections</CardTitle>
          <CardDescription>Receive a summary and reflection prompt each week</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="weekly-enabled">Enable weekly reflections</Label>
              <p className="text-sm text-muted-foreground">Get a weekly summary of your activity</p>
            </div>
            <Switch
              id="weekly-enabled"
              checked={settings.weekly_reflections_enabled}
              onCheckedChange={(v) => updateSetting('weekly_reflections_enabled', v)}
            />
          </div>
          
          {settings.weekly_reflections_enabled && (
            <>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Reflection Day</Label>
                  <Select
                    value={String(settings.reflection_day)}
                    onValueChange={(v) => updateSetting('reflection_day', parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS_OF_WEEK.map(day => (
                        <SelectItem key={day.value} value={String(day.value)}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Time</Label>
                  <Select
                    value={String(settings.reflection_hour)}
                    onValueChange={(v) => updateSetting('reflection_hour', parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue>{formatHour(settings.reflection_hour)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => (
                        <SelectItem key={i} value={String(i)}>
                          {formatHour(i)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Silence Nudges */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Silence Detection</CardTitle>
          <CardDescription>Get a gentle prompt when you haven't logged in a while</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="silence-enabled">Enable silence nudges</Label>
              <p className="text-sm text-muted-foreground">Receive a prompt after quiet periods</p>
            </div>
            <Switch
              id="silence-enabled"
              checked={settings.silence_nudges_enabled}
              onCheckedChange={(v) => updateSetting('silence_nudges_enabled', v)}
            />
          </div>
          
          {settings.silence_nudges_enabled && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Silence threshold</Label>
                <span className="text-sm text-muted-foreground">
                  {settings.silence_threshold_days} days
                </span>
              </div>
              <Slider
                value={[settings.silence_threshold_days]}
                onValueChange={([v]) => updateSetting('silence_threshold_days', v)}
                min={3}
                max={14}
                step={1}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>3 days</span>
                <span>14 days</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Capture Reminders */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Capture Reminders</CardTitle>
          <CardDescription>Optional gentle reminders to log</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="capture-enabled">Enable capture reminders</Label>
              <p className="text-sm text-muted-foreground">Periodic gentle prompts to capture context</p>
            </div>
            <Switch
              id="capture-enabled"
              checked={settings.capture_reminders_enabled}
              onCheckedChange={(v) => updateSetting('capture_reminders_enabled', v)}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Tone */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Reflection Tone</CardTitle>
          <CardDescription>Choose how prompts and reflections are worded</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {TONES.map(tone => (
              <div
                key={tone.value}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  settings.reflection_tone === tone.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border/50 hover:border-border'
                }`}
                onClick={() => updateSetting('reflection_tone', tone.value)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{tone.label}</p>
                    <p className="text-sm text-muted-foreground">{tone.description}</p>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    settings.reflection_tone === tone.value
                      ? 'border-primary bg-primary'
                      : 'border-muted-foreground/30'
                  }`} />
                </div>
              </div>
            ))}
          </div>
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
