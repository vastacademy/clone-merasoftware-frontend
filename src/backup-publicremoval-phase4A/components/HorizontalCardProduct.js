import React, { useContext, useEffect, useRef, useState } from 'react'
import fetchCategoryWiseProduct from '../helpers/fetchCategoryWiseProduct'
import displayINRCurrency from '../helpers/displayCurrency'
// import { Code } from 'lucide-react'
import { Link } from 'react-router-dom'
import Context from '../context'

const HorizontalCardProduct = ({category, heading}) => {
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(true)
    const loadingList = new Array(3).fill(null)
    const scrollElement = useRef()
    const { fetchUserAddToCart } = useContext(Context)

    const fetchData = async() => {
        setLoading(true)
        const categoryProduct = await fetchCategoryWiseProduct(category)
        setLoading(false)
        setData(categoryProduct?.data)
    }

    useEffect(() => {
        fetchData()
    }, [])

    // Static tech stack for each card since it's not in your data
    const techStack = ['HTML5', 'CSS3', 'JS']

    return (
        <div className='container mx-auto px-4 my-6'>
            <h2 className='text-2xl font-semibold py-4'>{heading}</h2>

            <div className='flex gap-6 overflow-x-auto' ref={scrollElement}>
                {loading ? (
                    loadingList.map((_, index) => (
                        <div key={index} className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 rounded-xl p-3 shadow-lg w-80 border border-indigo-100">
                            <div className="flex gap-3">
                                <div className="relative w-28 flex-shrink-0">
                                    <div className="aspect-[3/4] rounded-lg bg-slate-200 animate-pulse" />
                                </div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-5 bg-slate-200 rounded animate-pulse" />
                                    <div className="h-4 bg-slate-200 rounded animate-pulse w-2/3" />
                                    <div className="space-y-2">
                                        <div className="flex gap-1">
                                            {[1, 2, 3].map((n) => (
                                                <div key={n} className="h-5 w-14 bg-slate-200 rounded animate-pulse" />
                                            ))}
                                        </div>
                                        <div className="h-6 bg-slate-200 rounded animate-pulse" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    data.map((product) => (
                        <div key={product?._id} className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 rounded-xl py-3 px-5 shadow-lg w-80 border border-indigo-100">
                            <div className="flex gap-3">
                                {/* Image Frame */}
                                <div className="relative w-28 flex-shrink-0">
                                    <div className="aspect-[3/4] rounded-lg overflow-hidden bg-gradient-to-r from-indigo-100 to-purple-100">
                                        <img 
                                            src={product?.serviceImage[0]} 
                                            alt={product?.serviceName}
                                            className="w-full h-full object-cover opacity-90"
                                        />
                                    </div>
                                </div>
                                
                                <div className="flex-1">
                                    {/* Title & Type */}
                                    <div className="mb-2">
                                        <h3 className="text-indigo-950 font-bold text-base mb-0.5">
                                            {product?.serviceName}
                                        </h3>
                                        <div className="flex items-center gap-1.5">
                                            {/* <Code className="w-3.5 h-3.5 text-indigo-600" /> */}
                                            <span className="text-xs text-indigo-800">
                                                {product?.category || 'Static Website'}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {/* Technologies */}
                                    <div className="flex flex-wrap gap-1 mb-2">
                                        {techStack.map((tech) => (
                                            <span 
                                                key={tech}
                                                className="text-xs font-medium bg-white text-indigo-700 px-1.5 py-0.5 rounded-md shadow-sm border border-indigo-100"
                                            >
                                                {tech}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Price */}
                                    <div className="pt-2 border-t border-indigo-100">
                                        <p className="text-base font-bold text-indigo-950">
                                            {displayINRCurrency(product?.sellingPrice)}
                                            <span className="text-xs font-normal text-indigo-600 ml-1">onwards</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

export default HorizontalCardProduct