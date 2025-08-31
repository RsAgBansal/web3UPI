// components/SplineScene.jsx
import React from 'react'
import Spline from '@splinetool/react-spline'

export default function SplineScene() {
  const sceneUrl = "https://prod.spline.design/leyImLNU5GdZNMUi/scene.splinecode"

  return (
    <div className="w-full h-full">
      <Spline
        scene={sceneUrl}
        className="w-full h-full"
      />
    </div>
  )
}
