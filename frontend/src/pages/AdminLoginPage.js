import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { User, Lock, Loader2, ShieldCheck } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const AdminLoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { loginWithPassword } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!username.trim()) {
            toast.error('يرجى إدخال اسم المستخدم');
            return;
        }

        if (!password) {
            toast.error('يرجى إدخال كلمة المرور');
            return;
        }

        setLoading(true);
        try {
            await loginWithPassword(username, password);
            toast.success('تم تسجيل الدخول بنجاح');

            // Redirect based on role
            const currentUser = JSON.parse(localStorage.getItem('user'));
            if (currentUser?.role === 'sales') {
                navigate('/rentals');
            } else {
                navigate('/dashboard');
            }
        } catch (error) {
            const errorMsg = error.response?.data?.detail || 'فشل تسجيل الدخول';
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-100 relative overflow-hidden" dir="rtl">
            <div className="fixed inset-0 pointer-events-none opacity-30">
                <div className="absolute top-0 -right-40 w-80 h-80 bg-gradient-to-br from-red-200/40 to-orange-200/40 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 -left-40 w-96 h-96 bg-gradient-to-tr from-orange-200/30 to-yellow-200/30 rounded-full blur-3xl"></div>
            </div>

            <Header />

            <div className="flex-1 flex items-center justify-center p-4 relative z-10">
                <div className="w-full max-w-md fade-in">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 shadow-lg mb-4">
                            <ShieldCheck className="text-white" size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">
                            دخول الإدارة
                        </h2>
                        <p className="text-slate-600">لوحة تحكم المسؤولين</p>
                    </div>

                    <Card className="modern-card shadow-xl border-t-4 border-red-500">
                        <CardHeader className="space-y-1 pb-6">
                            <CardTitle className="text-2xl font-bold text-center text-slate-800">
                                تسجيل الدخول
                            </CardTitle>
                            <CardDescription className="text-center text-slate-600">
                                أدخل اسم المستخدم وكلمة المرور
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="username">اسم المستخدم</Label>
                                    <div className="relative flex items-center gap-2">
                                        <div className="absolute right-3 text-slate-400">
                                            <User size={20} />
                                        </div>
                                        <Input
                                            id="username"
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="h-12 border-slate-200 pr-10 text-lg"
                                            placeholder="اسم المستخدم"
                                            autoFocus
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password">كلمة المرور</Label>
                                    <div className="relative flex items-center gap-2">
                                        <div className="absolute right-3 text-slate-400">
                                            <Lock size={20} />
                                        </div>
                                        <Input
                                            id="password"
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="h-12 border-slate-200 pr-10"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-12 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-semibold"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            جاري التحقق...
                                        </>
                                    ) : (
                                        'دخول'
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default AdminLoginPage;
