import { useState } from "react";
import { useImports, useUploadFile } from "@/hooks/use-imports";
import { Header } from "@/components/layout/header";
import { FileUpload } from "@/components/common/file-upload";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, CheckCircle, AlertTriangle, X, FileText } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

export default function Import() {
  const { data: imports, isLoading } = useImports();
  const uploadFile = useUploadFile();
  const { toast } = useToast();

  const handleFileUpload = async (file: File) => {
    try {
      const result = await uploadFile.mutateAsync(file);
      toast({
        title: "Файл загружен",
        description: `Обработано ${result.processedRows} записей`,
      });
    } catch (error) {
      toast({
        title: "Ошибка загрузки",
        description: error instanceof Error ? error.message : "Неизвестная ошибка",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processed': return <CheckCircle className="h-5 w-5 text-success" />;
      case 'partial': return <AlertTriangle className="h-5 w-5 text-warning" />;
      case 'failed': return <X className="h-5 w-5 text-destructive" />;
      case 'processing': return <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />;
      default: return <FileText className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processed': return 'bg-success/10 text-success';
      case 'partial': return 'bg-warning/10 text-warning';
      case 'failed': return 'bg-destructive/10 text-destructive';
      case 'processing': return 'bg-primary/10 text-primary';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'processed': return 'Успешно';
      case 'partial': return 'С ошибками';
      case 'failed': return 'Ошибка';
      case 'processing': return 'Обработка';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Импорт данных" />
        <main className="p-8">
          <div className="text-center py-8">
            <div className="text-muted-foreground">Загрузка...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header title="Импорт данных" subtitle="Загрузка часов работы из XLSX файла" />

      <main className="p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Upload Section */}
          <div className="bg-card rounded-lg border border-border elevated-card">
            <div className="border-b border-border px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Загрузка файла</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Поддерживаются форматы XLSX и XLS с колонкой "phone" и колонками дат
                  </p>
                </div>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Шаблон XLSX
                </Button>
              </div>
            </div>
            
            <div className="p-6">
              <FileUpload
                onFileUpload={handleFileUpload}
                uploading={uploadFile.isPending}
              />
            </div>
          </div>

          {/* Recent Imports */}
          <div className="bg-card rounded-lg border border-border elevated-card">
            <div className="border-b border-border px-6 py-4">
              <h3 className="text-lg font-semibold text-foreground">Последние импорты</h3>
            </div>
            
            <div className="p-6">
              {!imports || imports.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <div className="text-muted-foreground">Импорты отсутствуют</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {imports.map((importRecord) => (
                    <div key={importRecord.id} className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                      <div className="w-10 h-10 bg-background rounded-lg flex items-center justify-center">
                        {getStatusIcon(importRecord.status)}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-foreground" data-testid={`import-filename-${importRecord.id}`}>
                          {importRecord.fileName}
                        </div>
                        <div className="text-xs text-muted-foreground" data-testid={`import-details-${importRecord.id}`}>
                          {format(new Date(importRecord.uploadedAt), 'dd MMM yyyy в HH:mm', { locale: ru })} • {importRecord.rowsCount} записей
                          {importRecord.errorsJson && (
                            <span>, {JSON.parse(importRecord.errorsJson).length} ошибок</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(importRecord.status)} data-testid={`import-status-${importRecord.id}`}>
                          {getStatusLabel(importRecord.status)}
                        </Badge>
                        {importRecord.errorsJson && (
                          <Button variant="ghost" size="sm">
                            <AlertTriangle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Import Instructions */}
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Формат файла</h3>
            <div className="space-y-3 text-sm">
              <div>
                <h4 className="font-medium text-foreground mb-2">Требования к структуре:</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Первая колонка должна называться "phone" и содержать номера телефонов участников</li>
                  <li>Следующие колонки должны содержать даты в любом распознаваемом формате</li>
                  <li>В ячейках указывается количество отработанных часов (целые или дробные числа)</li>
                  <li>Пустые ячейки игнорируются</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">Пример структуры:</h4>
                <div className="bg-muted p-3 rounded font-mono text-xs">
                  <div>phone | 2025-01-01 | 2025-01-02 | 2025-01-03</div>
                  <div>+79001234567 | 8.5 | 7.0 | 9.2</div>
                  <div>+79009876543 | 6.0 | 8.5 | 7.5</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
