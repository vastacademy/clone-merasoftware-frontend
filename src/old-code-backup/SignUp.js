import React, { useState, useEffect } from 'react'
import loginIcons from "../assest/signin.gif";
import { FaEye } from "react-icons/fa";
import { FaEyeSlash } from "react-icons/fa";
import { Link, useNavigate } from 'react-router-dom';
import imageTobase64 from '../helpers/imageTobase64';
import SummaryApi from '../common';
import { toast } from 'sonner';

const SignUp = ({ onClose, callFunc }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [generalUsers, setGeneralUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [data, setData] = useState({
    email: "",
    password: "",
    name: "",
    confirmPassword: "",
    profilePic: "",
    referredBy: "", // Add this new field
    role: "customer" // default role
  })
  
  // Fetch all partner users when component mounts
  useEffect(() => {
    const fetchPartnerUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch(SummaryApi.allUser.url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
        const result = await response.json();
        
        if (result.success) {
          // Filter users with partner role
          const partnerUsers = result.data.filter(user => user.roles && user.roles.includes('partner'));
          setGeneralUsers(partnerUsers);
        } else {
          toast.error("Failed to load referral users");
        }
      } catch (error) {
        console.error("Error fetching users:", error);
        toast.error("Something went wrong while loading users");
      } finally {
        setLoading(false);
      }
    };
    
    fetchPartnerUsers();
  }, []);
  
  const handleOnChange = (e) => {
    const {name, value} = e.target
    
    setData((preve)=>{
      return {
        ...preve,
        [name] : value
      }
    })
  }

  const handleUploadPic = async (e) => {
    const file = e.target.files[0]
    
    const imagePic = await imageTobase64(file)

    setData((preve) => {
      return{
        ...preve,
        profilePic: imagePic 
      }
    })
  }

  const handleSubmit = async (e) =>{
    e.preventDefault()

    if(data.password === data.confirmPassword){
      const dataResponse = await fetch(SummaryApi.signUP.url,{
        method : SummaryApi.signUP.method,
        headers : {
          "content-type" : "application/json"
        },
        body : JSON.stringify(data)
      })
      const dataApi = await dataResponse.json() 

      if(dataApi.success){
        toast.success(dataApi.message)
        if(callFunc) callFunc()
        if(onClose) onClose()
      }

      if(dataApi.error){
        toast.error(dataApi.message)
      }
      
    }else{
       toast.error("Please check password and confirm password")
    }
  }  

  return (
    <section id="signup">
      <div className="max-auto container p-4">
        <div className="bg-white p-5 w-full max-w-sm mx-auto">
          <div className="w-20 h-20 mx-auto relative overflow-hidden rounded-full">
            <div>
              <img src={data.profilePic || loginIcons} alt="login icon" />
            </div>
            <form>
              <label>
                <div className="text-xs bg-slate-200 bg-opacity-80 pb-4 pt-2 cursor-pointer text-center absolute bottom-0 w-full">
                  Upload Photo
                </div>
                <input type='file' className='hidden' onChange={handleUploadPic}/>
              </label>
            </form>
          </div>

          <form className="pt-6 flex flex-col gap-2" onSubmit={handleSubmit}>
            <div className="grid mb-2">
              <label>Name: </label>
              <div className="bg-slate-200 p-2">
                <input
                  type="text"
                  placeholder="enter your name"
                  name="name"
                  value={data.name}
                  onChange={handleOnChange}
                  required
                  className="w-full h-full outline-none bg-transparent"
                />
              </div>
            </div>

            <div className="grid mb-2">
              <label>Email: </label>
              <div className="bg-slate-200 p-2">
                <input
                  type="email"
                  placeholder="enter email"
                  name="email"
                  value={data.email}
                  onChange={handleOnChange}
                  required
                  className="w-full h-full outline-none bg-transparent"
                />
              </div>
            </div>

            <div className='mb-2'>
              <label>Password: </label>
              <div className="bg-slate-200 p-2 flex">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="enter password"
                  value={data.password}
                  onChange={handleOnChange}
                  required
                  className="w-full h-full outline-none bg-transparent"
                />
                <div
                  className="cursor-pointer text-xl"
                  onClick={() => setShowPassword((preve) => !preve)}
                >
                  <span>
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
              </div>
            </div>

            <div className='mb-2'>
              <label>Confirm Password: </label>
              <div className="bg-slate-200 p-2 flex">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="enter Confirm password"
                  value={data.confirmPassword}
                  onChange={handleOnChange}
                  required
                  className="w-full h-full outline-none bg-transparent"
                />
                <div
                  className="cursor-pointer text-xl"
                  onClick={() => setShowConfirmPassword((preve) => !preve)}
                >
                  <span>
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid mb-2">
              <label>Role: </label>
              <div className="bg-slate-200 p-2">
                <select 
                  className='w-full bg-transparent outline-none'
                  name="role"
                  value={data.role}
                  onChange={handleOnChange}
                  required
                >
                  <option value="">--Select Role--</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="partner">Partner</option>
                  <option value="customer">Customer</option>
                  <option value="developer">Developer</option>
                </select>
              </div>
            </div>

            <div className="grid mb-2">
              <label>Referral By: </label>
              <div className="bg-slate-200 p-2">
                <select 
                  className='w-full bg-transparent outline-none'
                  name="referredBy"
                  value={data.referredBy}
                  onChange={handleOnChange}
                >
                  <option value="">--Select User--</option>
                  {loading ? (
                    <option disabled>Loading users...</option>
                  ) : (
                    generalUsers.map(user => (
                      <option key={user._id} value={user._id}>
                        {user.name} ({user.email})
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 w-full max-w-[150px] rounded-full hover:scale-110 transition-all mx-auto block mt-6">
              Sign Up
            </button>
          </form>

          <p className='my-5'>Already have account ? <Link to={"/login"} className=' text-red-600 hover:text-red-700 hover:underline'>Login</Link></p>
        </div>
      </div>
    </section> 
  )
}

export default SignUp;
