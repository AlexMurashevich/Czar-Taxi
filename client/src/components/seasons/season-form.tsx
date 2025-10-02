import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";

const seasonSchema = z.object({
  name: z.string().min(1, "Название обязательно"),
  startDate: z.string().min(1, "Дата начала обязательна"),
  endDate: z.string().min(1, "Дата окончания обязательна"),
  dailyTargetHours: z.string().min(1, "Дневная цель обязательна"),
  participantSource: z.enum(['carry-over', 'upload-new']),
  roleAssignment: z.enum(['auto-assign', 'first-season'])
});

type SeasonFormData = z.infer<typeof seasonSchema>;

interface SeasonFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: SeasonFormData) => void;
  isSubmitting?: boolean;
}

export function SeasonForm({ open, onOpenChange, onSubmit, isSubmitting }: SeasonFormProps) {
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  const form = useForm<SeasonFormData>({
    resolver: zodResolver(seasonSchema),
    defaultValues: {
      participantSource: 'carry-over',
      roleAssignment: 'auto-assign'
    }
  });

  const handleSubmit = (data: SeasonFormData) => {
    const startDateObj = startDate || new Date(data.startDate);
    const endDateObj = endDate || new Date(data.endDate);
    const daysCount = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const monthlyTarget = Number(data.dailyTargetHours) * daysCount;

    onSubmit({
      ...data,
      startDate: startDateObj.toISOString().split('T')[0],
      endDate: endDateObj.toISOString().split('T')[0]
    });
  };

  const calculateSeasonGoal = () => {
    const dailyGoal = Number(form.watch('dailyTargetHours')) || 0;
    if (!startDate || !endDate || dailyGoal === 0) return 0;
    
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return dailyGoal * days;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Создать новый сезон</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Season Name */}
          <div>
            <Label htmlFor="name">Название сезона</Label>
            <Input
              id="name"
              placeholder="Например: Февраль 2025"
              {...form.register('name')}
              data-testid="input-season-name"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>
            )}
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Дата начала</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                    data-testid="button-start-date"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "dd MMMM yyyy", { locale: ru }) : "Выберите дату"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      setStartDate(date);
                      if (date) {
                        form.setValue('startDate', date.toISOString().split('T')[0]);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>Дата окончания</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                    data-testid="button-end-date"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "dd MMMM yyyy", { locale: ru }) : "Выберите дату"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => {
                      setEndDate(date);
                      if (date) {
                        form.setValue('endDate', date.toISOString().split('T')[0]);
                      }
                    }}
                    disabled={(date) => startDate ? date < startDate : false}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Daily Goal */}
          <div>
            <Label htmlFor="dailyTargetHours">Дневная цель (часов на одного водителя)</Label>
            <div className="relative">
              <Input
                id="dailyTargetHours"
                type="number"
                step="0.1"
                placeholder="6.7"
                {...form.register('dailyTargetHours')}
                data-testid="input-daily-goal"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">часов</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Цель сезона будет рассчитана автоматически (дневная цель × количество дней)
            </p>
            {form.formState.errors.dailyTargetHours && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.dailyTargetHours.message}</p>
            )}
          </div>

          {/* Auto-calculation Display */}
          {startDate && endDate && form.watch('dailyTargetHours') && (
            <div className="bg-muted rounded-lg p-4">
              <div className="text-sm font-medium text-foreground mb-2">Автоматический расчёт:</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Количество дней:</span>
                  <span className="font-semibold">
                    {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1} дней
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Цель сезона для водителя:</span>
                  <span className="font-bold text-foreground">
                    {calculateSeasonGoal()} часов
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Participants Import */}
          <div>
            <Label>Список участников</Label>
            <RadioGroup
              value={form.watch('participantSource')}
              onValueChange={(value) => form.setValue('participantSource', value as 'carry-over' | 'upload-new')}
              className="mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="carry-over" id="carry-over" />
                <Label htmlFor="carry-over">Перенести из предыдущего сезона</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="upload-new" id="upload-new" />
                <Label htmlFor="upload-new">Загрузить новый список (CSV/XLSX)</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Role Assignment */}
          <div>
            <Label>Назначение ролей</Label>
            <RadioGroup
              value={form.watch('roleAssignment')}
              onValueChange={(value) => form.setValue('roleAssignment', value as 'auto-assign' | 'first-season')}
              className="mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="auto-assign" id="auto-assign" />
                <Label htmlFor="auto-assign">Автоматически на основе результатов прошлого сезона</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="first-season" id="first-season" />
                <Label htmlFor="first-season">Первый сезон (все начинают водителями)</Label>
              </div>
            </RadioGroup>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={isSubmitting} data-testid="button-create-season">
              {isSubmitting ? "Создание..." : "Создать сезон"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
