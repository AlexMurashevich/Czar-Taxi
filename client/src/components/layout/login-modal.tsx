import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface LoginModalProps {
  open: boolean;
  onLoginSuccess: () => void;
}

export function LoginModal({ open, onLoginSuccess }: LoginModalProps) {
  const [adminKey, setAdminKey] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ adminKey })
      });

      if (response.ok) {
        toast({
          title: "Вход выполнен",
          description: "Добро пожаловать в админ-панель",
        });
        setAdminKey("");
        onLoginSuccess();
      } else {
        const error = await response.json();
        toast({
          title: "Ошибка входа",
          description: error.error || "Неверный ключ администратора",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось выполнить вход",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Вход в админ-панель</DialogTitle>
          <DialogDescription>
            Введите ключ администратора для доступа к системе
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="adminKey">Ключ администратора</Label>
            <Input
              id="adminKey"
              type="password"
              placeholder="Введите ключ"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              disabled={loading}
              data-testid="input-admin-key"
              required
            />
          </div>
          <Button 
            type="submit" 
            className="w-full"
            disabled={loading}
            data-testid="button-login"
          >
            {loading ? 'Вход...' : 'Войти'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
