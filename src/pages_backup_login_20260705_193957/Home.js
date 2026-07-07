import React from 'react'
import CategoryList from '../components/CategoryList'
import BannerProduct from '../components/BannerProduct'
// import HorizontalCardProduct from '../components/HorizontalCardProduct'
import VerticalCardProduct from '../components/VerticalCardProduct'
import AppConvertingBanner from '../components/AppConvertingBanner'
import HomeSecondBanner from '../components/HomeSecondBanner'

const Home = () => {
  return (
    <div className="max-w-7xl mx-auto px-6">
      <AppConvertingBanner/>
      <CategoryList/>

      <VerticalCardProduct category={"standard_websites"} heading={"Standard Websites"}/>
      <VerticalCardProduct category={"dynamic_websites"} heading={"Dynamic Websites"}/>

      <BannerProduct serviceName="home"/>
      <VerticalCardProduct category={"app_development"} heading={"Mobile Apps"}/>
      <VerticalCardProduct category={"cloud_software_development"} heading={"Cloud Softwares"}/>
      <VerticalCardProduct category={"feature_upgrades"} heading={"Feature Upgrades"}/>

      <HomeSecondBanner/>
    </div>
  )
}

export default Home;