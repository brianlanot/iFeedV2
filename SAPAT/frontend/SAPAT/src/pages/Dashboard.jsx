import { RiAddLine, RiFileList2Line, RiLeafLine, RiArrowRightLine } from 'react-icons/ri'
import { useNavigate, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import useAuth from '../hook/useAuth'
import Loading from '../components/Loading'
import { useTranslation } from 'react-i18next'

function Dashboard() {
  const { user, loading } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()

  if (loading) return <Loading />
  if (!user) return <Navigate to="/" />

  // Animation Variants (Kept for continuity)
  const containerVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, staggerChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.98 },
    visible: { opacity: 1, scale: 1 }
  }

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="max-w-6xl mx-auto space-y-10 p-2 md:p-6"
    >
      {/* --- WELCOME HEADER --- */}
      <section className="text-center md:text-left pt-2">
        <motion.p variants={itemVariants} className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </motion.p>
        <motion.h1 
          variants={itemVariants}
          className="text-deepbrown text-3xl md:text-4xl font-extrabold tracking-tighter"
        >
          {t('Hello')}, {user?.displayName}! 👋
        </motion.h1>
      </section>

      {/* --- HERO / CTA SECTION --- */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center overflow-hidden rounded-3xl bg-white p-6 md:p-10 border border-gray-100 shadow-sm"
      >
        <div className="md:col-span-8 space-y-5 text-center md:text-left order-2 md:order-1">
          <span className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
            <RiLeafLine /> {t('iFeed V2')}
          </span>
          <h2 className="text-deepbrown text-2xl md:text-3xl font-extrabold leading-tight tracking-tight">
            {t('Ready to build a balanced formulation?')}
          </h2>
          <p className="text-gray-600 max-w-xl text-base md:text-lg">
            {t('Start creating a new mix with our simplified tool. We will guide you through adding ingredients and checking nutrient levels.')}
          </p>
          <motion.button 
            whileHover={{ scale: 1.03 }}
            onClick={() => navigate('/formulations')}
            className="btn bg-green-button border-none text-white font-bold px-10 rounded-xl shadow-md hover:bg-green-600 group active:scale-95"
          >
            {t('Start Formulating')}
            <RiAddLine className="ml-2 text-xl group-hover:rotate-90 transition-transform" />
          </motion.button>
        </div>

        {/* STATIC IMAGE PLACEHOLDER - Stays neutral, uses theme border radii */}
        {/* --- IMAGE SECTION --- */}
<div className="md:col-span-4 order-1 md:order-2 flex items-center justify-center p-4">
  <div className="w-44 h-44 md:w-64 md:h-64 rounded-3xl bg-gray-50 flex items-center justify-center border border-gray-100 relative shadow-sm overflow-hidden">
    {/* The Image */}
    <motion.img 
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 300 }}
      src="assets/Carabao.jpg" // Ensure this path matches your project structure
      alt="Carabao"
      className="rounded-3xl object-cover w-full h-full shadow-inner"
      onError={(e) => {
        // Fallback if image path is incorrect
        e.target.style.display = 'none';
        e.target.nextSibling.style.display = 'flex';
      }}
    />

    {/* Fallback Icon (Hidden unless image fails) */}
    <div className="hidden flex-col items-center justify-center">
      <RiLeafLine className="text-green-button/20 text-7xl" />
      <span className="absolute bottom-4 text-[9px] uppercase tracking-wider text-gray-300 font-medium italic">
        Image not found
      </span>
    </div>
  </div>
</div>
      </motion.div>

      {/* --- COMPACT QUICK LINKS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <motion.button
          variants={itemVariants}
          whileHover={{ y: -4, borderColor: '#66bb6a' /* Matches green-button */ }}
          onClick={() => navigate('/formulations')}
          className="flex items-center gap-5 p-5 bg-white rounded-3xl border border-gray-100 shadow-sm transition-all text-left group"
        >
          <div className="p-4 bg-gray-50 text-deepbrown rounded-2xl border border-gray-100 transition-colors group-hover:bg-green-50 group-hover:text-green-700">
            <RiFileList2Line size={26} />
          </div>
          <div className="flex-grow">
            <h3 className="font-bold text-deepbrown text-lg">{t('My Formulations')}</h3>
            <p className="text-sm text-gray-500">{t('View, edit, and manage your saved mixes')}</p>
          </div>
          <RiArrowRightLine className="text-gray-300 group-hover:text-green-600 group-hover:translate-x-1 transition-transform" size={20} />
        </motion.button>

        <motion.button
          variants={itemVariants}
          whileHover={{ y: -4, borderColor: '#66bb6a' }}
          onClick={() => navigate('/ingredients')}
          className="flex items-center gap-5 p-5 bg-white rounded-3xl border border-gray-100 shadow-sm transition-all text-left group"
        >
          <div className="p-4 bg-gray-50 text-deepbrown rounded-2xl border border-gray-100 transition-colors group-hover:bg-green-50 group-hover:text-green-700">
            <RiLeafLine size={26} />
          </div>
          <div className="flex-grow">
            <h3 className="font-bold text-deepbrown text-lg">{t('Ingredients Library')}</h3>
            <p className="text-sm text-gray-500">{t('Check nutrient levels and update prices')}</p>
          </div>
          <RiArrowRightLine className="text-gray-300 group-hover:text-green-600 group-hover:translate-x-1 transition-transform" size={20} />
        </motion.button>
      </div>
    </motion.div>
  )
}

export default Dashboard