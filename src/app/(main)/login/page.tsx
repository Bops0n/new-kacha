'use client'; // This component needs to be a Client Component for interactivity

import { useState } from 'react';
import Link from 'next/link';
import { FiMail, FiLock, FiUser, FiCheckCircle } from 'react-icons/fi'; // Icons for inputs
import { signIn, useSession } from 'next-auth/react';
import { useAlert } from '@/app/context/AlertModalContext';
import { useSearchParams, useRouter } from "next/navigation";
import LoadingSpinner from '@/app/components/LoadingSpinner';

export default function AuthPage() {

  const { status, update } = useSession();
  const { showAlert } = useAlert();

  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get("callbackUrl") ?? "";
  
  // useEffect(()=>{
  //   if (session.status === 'authenticated')
  //     redirect('/')
  // },[session.status])
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login'); // State to control active tab

  const [loginFormData, setLoginFormData] = useState({
    usernameOremail: '',
    password: '',
    rememberMe: false,
  });

  const [registerFormData, setRegisterFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setLoginFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegisterFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
        
    if (!loginFormData.usernameOremail || !loginFormData.password) {
      showAlert("กรุณากรอกบัญชีผู้ใช้และรหัสผ่าน!", 'warning');
      return;
    }

    const result = await signIn('credentials', {
      redirect: false,
      username: loginFormData.usernameOremail,
      password: loginFormData.password,
      rememberMe: loginFormData.rememberMe,
      callbackUrl: callbackUrl
    });

    if (result?.ok) router.push(callbackUrl);
    
    update();

    switch (result?.status)
    {
      case 200:
        setTimeout(() => {
          showAlert("เข้าสู่ระบบสำเร็จ!", 'success');
        }, 500);
        break;
      
      default: showAlert(`${result?.error}`, 'error'); return;
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!registerFormData.username || !registerFormData.email || !registerFormData.password || !registerFormData.confirmPassword) {
      showAlert("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน!", 'warning');
      return;
    }
    if (registerFormData.password !== registerFormData.confirmPassword) {
      showAlert("รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน!", 'warning');
      return;
    }
    
    const result = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(registerFormData),
    });
    
    const data = await result.json();
    
    switch (result.status)
    {
      case 200:
        setRegisterFormData({
          username: '',
          email: '',
          password: '',
          confirmPassword: ''
        });
        
        setTimeout(() => {
          showAlert("ลงทะเบียนสำเร็จ! กรุณาเข้าสู่ระบบ", 'success');
          setActiveTab('login');
        }, 500);
        break;
      
      default: showAlert(`${data.message}`, 'error'); return;
    }
  };

  if(status === 'loading') return (<LoadingSpinner/>)

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4 pt-60">
      <div className="w-full max-w-md bg-base-100 rounded-lg shadow-xl overflow-hidden">
        {/* Tabs */}
        <div role="tablist" className="tabs tabs-bordered tabs-lg w-full">
          <a
            role="tab"
            className={`tab flex-1 ${activeTab === 'login' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('login')}
          >
            เข้าสู่ระบบ
          </a>
          <a
            role="tab"
            className={`tab flex-1 ${activeTab === 'register' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('register')}
          >
            สมัครสมาชิก
          </a>
        </div>

        {/* Tab Content */}
        <div className="p-8">
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-6">
              <h2 className="text-2xl font-bold text-base-content text-center mb-6">เข้าสู่ระบบ</h2>

              {/* Email/Username */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-base-content">อีเมล / ชื่อผู้ใช้งาน</span>
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/60 z-10" />
                  <input
                    type="text"
                    name="usernameOremail"
                    placeholder="your.email@example.com"
                    className="input input-bordered w-full pl-10 pr-4"
                    value={loginFormData.usernameOremail}
                    onChange={handleLoginChange}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-base-content">รหัสผ่าน</span>
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/60 z-10" />
                  <input
                    type="password"
                    name="password"
                    placeholder="รหัสผ่านของคุณ"
                    className="input input-bordered w-full pl-10 pr-4"
                    value={loginFormData.password}
                    onChange={handleLoginChange}
                    required
                  />
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-sm">
                <div className="form-control">
                  <label className="label cursor-pointer gap-2">
                    <input
                      type="checkbox"
                      name="rememberMe"
                      checked={loginFormData.rememberMe}
                      onChange={handleLoginChange}
                      className="checkbox checkbox-primary"
                    />
                    <span className="label-text text-base-content">จดจำฉันไว้</span>
                  </label>
                </div>
                <Link href="#" className="link link-hover text-primary">ลืมรหัสผ่าน?</Link>
              </div>

              {/* Login Button */}
              <button type="submit" className="btn btn-primary w-full text-lg">
                เข้าสู่ระบบ
              </button>

              {/* <div className="divider text-base-content/70">หรือ</div>

              <div className="flex flex-col gap-2">
                <button type="button" className="btn btn-outline w-full border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white">
                  <FaFacebook className="w-5 h-5 mr-2" />
                  เข้าสู่ระบบด้วย Facebook
                </button>
                <button type="button" className="btn btn-outline w-full border-gray-400 text-gray-700 hover:bg-gray-700 hover:text-white">
                  <FaGoogle className="w-5 h-5 mr-2" />
                  เข้าสู่ระบบด้วย Google
                </button>
              </div> */}
            </form>
          )}

          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-6">
              <h2 className="text-2xl font-bold text-base-content text-center mb-6">สมัครสมาชิกใหม่</h2>

              {/* Name */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-base-content">ชื่อ-นามสกุล</span>
                </label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/60 z-10" />
                  <input
                    type="text"
                    name="username"
                    placeholder="ชื่อของคุณ"
                    className="input input-bordered w-full pl-10 pr-4"
                    value={registerFormData.username}
                    onChange={handleRegisterChange}
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-base-content">อีเมล</span>
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/60 z-10" />
                  <input
                    type="email"
                    name="email"
                    placeholder="your.email@example.com"
                    className="input input-bordered w-full pl-10 pr-4"
                    value={registerFormData.email}
                    onChange={handleRegisterChange}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-base-content">รหัสผ่าน</span>
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/60 z-10" />
                  <input
                    type="password"
                    name="password"
                    placeholder="ตั้งรหัสผ่านของคุณ"
                    className="input input-bordered w-full pl-10 pr-4"
                    value={registerFormData.password}
                    onChange={handleRegisterChange}
                    required
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-base-content">ยืนยันรหัสผ่าน</span>
                </label>
                <div className="relative">
                  <FiCheckCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/60 z-10" />
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="ยืนยันรหัสผ่านอีกครั้ง"
                    className="input input-bordered w-full pl-10 pr-4"
                    value={registerFormData.confirmPassword}
                    onChange={handleRegisterChange}
                    required
                  />
                </div>
              </div>

              {/* Register Button */}
              <button type="submit" className="btn btn-primary w-full text-lg">
                สมัครสมาชิก
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
