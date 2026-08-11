import SummaryApi from "../common"
import { toast } from 'sonner'

const addToCart = async (e, id, quantity, couponData = null) => {
    e?.stopPropagation()
    e?.preventDefault()
   
    const cartData = {
        productId: id
    }
   
    // Only add quantity if it's provided
    if (quantity !== undefined) {
        cartData.quantity = quantity
    }
    
    // Add coupon data if provided
    if (couponData) {
        cartData.couponCode = couponData.couponCode
        cartData.discountAmount = couponData.discountAmount
        cartData.finalPrice = couponData.finalPrice
    }
    
    const response = await fetch(SummaryApi.addToCartProduct.url, {
        method: SummaryApi.addToCartProduct.method,
        credentials: 'include',
        headers: {
            "content-type": "application/json"
        },
        body: JSON.stringify(cartData)
    })
    const responseData = await response.json()
    if(responseData.success){
        toast.success(responseData.message)
    }
    if(responseData.error){
        toast.error(responseData.message)
    }
    return responseData
}

export default addToCart