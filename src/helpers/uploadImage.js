const url = `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUD_NAME_CLOUDINARY}/image/upload`

const uploadImage = async(image) => {
    const formData = new FormData()
    formData.append("file",image)
    formData.append("upload_preset","mern_project")

    const dataResponse = await fetch(url,{
        method : "post",
        body : formData
    })
    const data = await dataResponse.json()

    if (!dataResponse.ok || (!data?.secure_url && !data?.url)) {
        throw new Error(data?.error?.message || "Image upload failed")
    }

    return {
        ...data,
        url: data.secure_url || data.url
    }
}

export default uploadImage
