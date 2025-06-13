import React from 'react'
import styles from './Nav.module.css'
import logo from '../assets/TurnersLogo.png'


export default function Nav() {
  return (
    <div className={styles.navContainer}>
        <img src={logo} alt="turners-logo" />
        <h2>Tina - Your AI Insurance Policy Assistant</h2>
    </div>
  )
}