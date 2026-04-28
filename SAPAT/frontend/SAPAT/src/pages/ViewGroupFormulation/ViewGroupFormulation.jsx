import {
  RiAddLine,
  RiCalculatorLine,
  RiDeleteBinLine,
  RiPencilLine,
  RiListSettingsLine,
  RiArrowDownSLine, RiErrorWarningLine, RiLineChartLine, RiDashboardLine, RiStackLine, RiArrowRightSLine, RiBookLine, RiHistoryLine,
  RiSettings4Line, RiMore2Fill, RiBarChartLine, RiInformationLine, RiMenuUnfoldLine
} from 'react-icons/ri'
import { useTranslation } from 'react-i18next'
import OptimizeFAB from '../../components/buttons/OptimizeFAB.jsx'
import Info from '../../components/icons/Info.jsx'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import Loading from '../../components/Loading.jsx'
import Toast from '../../components/Toast.jsx'
import Avatar from '../../components/Avatar.jsx'
import Selection from '../../components/Selection.jsx'
import ChooseIngredientsModal from '../../components/modals/viewformulation/ChooseIngredientsModal.jsx'
import ChooseNutrientsModal from '../../components/modals/viewformulation/ChooseNutrientsModal.jsx'
import ChooseNutrientRatiosModal from '../../components/modals/viewformulation/ChooseNutrientRatiosModal.jsx'
import Warning from '../../components/icons/Warning.jsx'
import ShadowPricingTab from '../../components/modals/viewformulation/ShadowPricingTab.jsx'
import ViewFormulationsModal from '../../components/modals/groupformulation/ViewFormulationsModal.jsx'
import OptimizationResultsModal from '../../components/modals/OptimizationResultsModal.jsx'
import ManualFormulation from '../../components/modals/ManualFormulation.jsx'
import IngredientSubstituteModal from '../../components/modals/formulations/SubstituteModal.jsx'
import InfeasibilityModal from '../../components/modals/formulations/InfeasibilityModal.jsx'
import handleGenerateReport from '../../components/handleGenerateReport.jsx'
import UserCustomizationModal from '../../components/modals/formulations/UserCustomizationModal.jsx'

const COLORS = ['#DC2626', '#D97706', '#059669', '#7C3AED', '#DB2777']

function ViewGroupFormulation({
  formulation,
  owner,
  userAccess,
  id,
  user,
  self,
  others,
  updateMyPresence,
  formulationRealTime,
  updateWeight,
  updateCode,
  updateName,
  updateDescription,
  updateAnimalGroup,
  updateCost,
  updateIngredients,
  updateNutrients,
  updateIngredientProperty,
  updateNutrientProperty,
  handleSave,
  updateShadowPrices,
  shadowPrices,
  nutrientsMenu,
  updateNutrientsMenu,
  ingredientsMenu,
  updateIngredientsMenu,
  nutrientRatioConstraints,
  updateNutrientRatioConstraints,
  formulations,
  groupFormulationDescription,
  groupFormulationName
}) {
  const VITE_API_URL = import.meta.env.VITE_API_URL
  const { t } = useTranslation()

  const [isLoading, setIsLoading] = useState(true)
  const [openNutMissing, setOpenNutMissing] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [message, setMessage] = useState('')
  const [toastAction, setToastAction] = useState('')
  const [listOfIngredients, setListOfIngredients] = useState([])
  const [listOfNutrients, setListOfNutrients] = useState([])
  const [isChooseIngredientsModalOpen, setIsChooseIngredientsModalOpen] = useState(false)
  const [isChooseNutrientsModalOpen, setIsChooseNutrientsModalOpen] = useState(false)
  const [isChooseNutrientRatiosModalOpen, setIsChooseNutrientRatiosModalOpen] = useState(false)
  const [viewFormulationsModalOpen, setViewFormulationsModalOpen] = useState(false)
  const [selectedIngredients, setSelectedIngredients] = useState([])
  const [selectedNutrients, setSelectedNutrients] = useState([])
  const [shadowPricingTabOpen, setShadowPricingTabOpen] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [filterIngredientCode, setFilterIngredientCode] = useState('')
  const isDisabled = userAccess === 'view'
  const [showRoughageLimits, setShowRoughageLimits] = useState(false)
  const [showConcentrateLimits, setShowConcentrateLimits] = useState(false)
  const [showVitaminLimits, setShowVitaminLimits] = useState(false)
  const [optimizationResults, setOptimizationResults] = useState(null)
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false)
  const [isCustomizationModalOpen, setIsCustomizationModalOpen] = useState(false)
  const [isPCCModalOpen, setIsPCCModalOpen] = useState(false)
  const [constraintMode, setConstraintMode] = useState('none')

  // --- Features synced from ViewFormulation ---
  const [isLargeOrSmaller, setIsLargeOrSmaller] = useState(false)
  const [activeTab, setActiveTab] = useState(null)
  const [showAllDetails, setShowAllDetails] = useState(false)
  const [recentFormulation, setRecentFormulation] = useState('None Yet')
  const [advancedPressed, setAdvancedPressed] = useState(false)
  const [missingNutrientsValue, setMissingNutrientsValue] = useState([])
  const [isSubModalOpen, setIsSubModalOpen] = useState(false)
  const [substitutesLoading, setSubstitutesLoading] = useState(false)
  const [modalData, setModalData] = useState({ name: '', details: null, substitutes: [] })
  const [infeasibilityModal, setInfeasibilityModal] = useState({ isOpen: false, data: null })
  const [detailedIngredients, setDetailedIngredients] = useState('')
  const [isManualFormulationOpen, setIsManualFormulationOpen] = useState(false)
  const [nutrientRatioModifyType, setNutrientRatioModifyType] = useState('add')
  const [editingNutrientRatioIndex, setEditingNutrientRatioIndex] = useState(null)
  const [nutrientRatioToEdit, setNutrientRatioToEdit] = useState(null)

  useEffect(() => {
    const checkSize = () => setIsLargeOrSmaller(window.innerWidth <= 1024)
    checkSize()
    window.addEventListener('resize', checkSize)
    return () => window.removeEventListener('resize', checkSize)
  }, [])

  const toggleTab = (tab) => {
    setActiveTab(activeTab === tab ? null : tab)
  }

  useEffect(() => {
    if (formulation) {
      setSelectedIngredients(formulation.ingredients || [])
      setSelectedNutrients(formulation.nutrients || [])
    }
  }, [formulation])

  useEffect(() => {
    if (formulation) showNutrientsMissingBasedonIngredientsPresent()
  }, [formulation, selectedIngredients])

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        if (formulation) await Promise.all([fetchIngredients(), fetchNutrients()])
      } catch (error) {
        console.log(error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [formulation])

  useEffect(() => {
    isDirty && updateCost(0)
  }, [isDirty])

  // --- Ingredient substitute click (from ViewFormulation) ---
  const handleIngredientClick = async (ingredient) => {
    setIsSubModalOpen(true)
    setSubstitutesLoading(true)
    const targetId = ingredient.ingredient_id || ingredient._id
    setModalData({ name: ingredient.name, details: null, substitutes: [] })
    try {
      const detailsRes = await fetch(`${VITE_API_URL}/ingredient/${targetId}/${owner?.userId}`)
      const detailsData = await detailsRes.json()
      const currentNutrients = formulationRealTime?.nutrients || []
      const subRes = await fetch(`${VITE_API_URL}/suggest-substitute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: owner?.userId, targetIngredientId: targetId, nutrients: currentNutrients })
      })
      const subData = await subRes.json()
      setModalData({ name: ingredient.name, details: detailsData.ingredients, substitutes: subData.substitutes || [] })
    } catch (error) {
      console.error('Error fetching ingredient data:', error)
    } finally {
      setSubstitutesLoading(false)
    }
  }

  const organizeIngredients = (fetchedData) => {
    setListOfIngredients(fetchedData)
    const arr2Ids = new Set(formulation.ingredients.map((item) => item.ingredient_id))
    const unusedIngredients = fetchedData.filter((item) => !arr2Ids.has(item.ingredient_id || item._id))
    updateIngredientsMenu(unusedIngredients)
    const listOfIngredientsIds = new Set(fetchedData.map((item) => item.ingredient_id || item._id))
    const nonExistingIngredients = formulation.ingredients.filter((item) => !listOfIngredientsIds.has(item.ingredient_id))
    const nonExistingIngredientsIds = new Set(nonExistingIngredients.map((item) => item.ingredient_id))
    updateIngredients(ingredients.filter((item) => !nonExistingIngredientsIds.has(item.ingredient_id)))
  }

  const organizeNutrients = (fetchedData) => {
    const arr2Ids = new Set(formulation.nutrients.map((item) => item.nutrient_id))
    const unusedNutrients = fetchedData.filter((item) => !arr2Ids.has(item.nutrient_id || item._id))
    updateNutrientsMenu(unusedNutrients)
    const listOfNutrientsIds = new Set(fetchedData.map((item) => item.nutrient_id || item._id))
    const nonExistingNutrients = formulation.nutrients.filter((item) => !listOfNutrientsIds.has(item.nutrient_id))
    const nonExistingNutrientsIds = new Set(nonExistingNutrients.map((item) => item.nutrient_id))
    updateNutrients(nutrients.filter((item) => !nonExistingNutrientsIds.has(item.nutrient_id)))
  }

  const fetchIngredients = async () => {
    try {
      const res = await axios.get(`${VITE_API_URL}/ingredient/filtered/${owner?.userId}?limit=10000`)
      organizeIngredients(res.data.ingredients)
    } catch (err) { console.log(err) }
  }

  const fetchNutrients = async () => {
    try {
      const res = await axios.get(`${VITE_API_URL}/nutrient/filtered/${owner?.userId}?limit=10000`)
      setListOfNutrients(res.data.nutrients)
      organizeNutrients(res.data.nutrients)
    } catch (err) { console.log(err) }
  }

  const hideToast = () => { setShowToast(false); setMessage(''); setToastAction('') }

  const handleAddIngredients = async (ingredientsToAdd) => {
    try {
      const ingredientsWithGroup = ingredientsToAdd.map((ingredient) => {
        const matched = ingredientsMenu.find((item) => item._id === ingredient.ingredient_id || item.ingredient_id === ingredient.ingredient_id)
        return { ...ingredient, group: matched?.group || '' }
      })
      const formattedIngredients = ingredientsWithGroup.map((ingredient) => {
        const menuIngredient = ingredientsMenu.find((item) => item.ingredient_id === ingredient.ingredient_id || item._id === ingredient.ingredient_id)
        return { ...ingredient, minimum: 0, maximum: 0, value: 0, group: menuIngredient?.group || '' }
      })
      setSelectedIngredients([...selectedIngredients, ...formattedIngredients])
      const arr2Ids = new Set(formattedIngredients.map((item) => item.ingredient_id))
      updateIngredientsMenu(ingredientsMenu.filter((item) => !arr2Ids.has(item.ingredient_id || item._id)))
      updateCost(0)
      updateIngredients([...selectedIngredients, ...formattedIngredients])
      setIsChooseIngredientsModalOpen(false)
      setIsDirty(false)
      setShowToast(true); setMessage(t('Ingredients added successfully')); setToastAction('success')
    } catch (err) {
      console.log(err)
      setShowToast(true); setMessage(t('Error adding ingredients')); setToastAction('error')
    }
  }

  const handleAddNutrients = async (nutrientsToAdd) => {
    try {
      const formattedNutrients = nutrientsToAdd.map((nutrient) => ({ ...nutrient, minimum: 0, maximum: 0, value: 0 }))
      setSelectedNutrients([...selectedNutrients, ...formattedNutrients])
      const arr2Ids = new Set(formattedNutrients.map((item) => item.nutrient_id))
      updateNutrientsMenu(nutrientsMenu.filter((item) => !arr2Ids.has(item.nutrient_id || item._id)))
      updateCost(0)
      updateNutrients([...selectedNutrients, ...formattedNutrients])
      setIsChooseNutrientsModalOpen(false)
      setIsDirty(false)
      setShowToast(true); setMessage(t('Nutrients added successfully')); setToastAction('success')
    } catch (err) {
      console.log(err)
      setShowToast(true); setMessage(t('Error adding nutrients')); setToastAction('error')
    }
  }

  const handleRemoveIngredient = async (ingredientToRemove) => {
    try {
      setSelectedIngredients(selectedIngredients.filter((item) => item.ingredient_id !== ingredientToRemove.ingredient_id))
      updateIngredients(ingredients.filter((item) => item.ingredient_id !== ingredientToRemove.ingredient_id))
      const removedIngredient = listOfIngredients.find((item) =>
        item.ingredient_id ? item.ingredient_id === ingredientToRemove.ingredient_id : item._id === ingredientToRemove.ingredient_id
      )
      if (removedIngredient) updateIngredientsMenu([removedIngredient, ...ingredientsMenu])
      updateCost(0)
      setIsDirty(false)
      setShowToast(true); setMessage(t('Ingredient removed successfully')); setToastAction('success')
    } catch (err) {
      console.log(err)
      setShowToast(true); setMessage(t('Error removing ingredient')); setToastAction('error')
    }
  }

  const handleRemoveNutrient = async (nutrientToRemove) => {
    try {
      setSelectedNutrients(selectedNutrients.filter((item) => item.nutrient_id !== nutrientToRemove.nutrient_id))
      updateNutrients(nutrients.filter((item) => item.nutrient_id !== nutrientToRemove.nutrient_id))
      const removedNutrient = listOfNutrients.find((item) =>
        item.nutrient_id ? item.nutrient_id === nutrientToRemove.nutrient_id : item._id === nutrientToRemove.nutrient_id
      )
      if (removedNutrient) updateNutrientsMenu([removedNutrient, ...nutrientsMenu])
      const filteredConstraints = (nutrientRatioConstraints || []).filter(
        (c) => c.firstIngredientId !== nutrientToRemove.nutrient_id && c.secondIngredientId !== nutrientToRemove.nutrient_id
      )
      if (filteredConstraints.length !== (nutrientRatioConstraints || []).length) updateNutrientRatioConstraints(filteredConstraints)
      updateCost(0)
      setIsDirty(false)
      setShowToast(true); setMessage(t('Nutrient removed successfully')); setToastAction('success')
    } catch (err) {
      console.log(err)
      setShowToast(true); setMessage(t('Error removing nutrient')); setToastAction('error')
    }
  }

  const handleIngredientMinimumChange = (index, value) => {
    value === 'N/A' || value === '' ? updateIngredientProperty(index, 'minimum', 0) : updateIngredientProperty(index, 'minimum', value)
  }
  const handleIngredientMaximumChange = (index, value) => {
    value === 'N/A' || value === '' ? updateIngredientProperty(index, 'maximum', 0) : updateIngredientProperty(index, 'maximum', value)
  }
  const handleNutrientMinimumChange = (index, value) => {
    value === 'N/A' || value === '' ? updateNutrientProperty(index, 'minimum', 0) : updateNutrientProperty(index, 'minimum', value)
  }
  const handleNutrientMaximumChange = (index, value) => {
    value === 'N/A' || value === '' ? updateNutrientProperty(index, 'maximum', 0) : updateNutrientProperty(index, 'maximum', value)
  }

  const resetFormulationToInitialState = () => {
    nutrients.forEach((nutrient, index) => {
      handleNutrientMinimumChange(nutrient.nutrient_id, formulation.origNutrientTargets[index].minimum)
      handleNutrientMaximumChange(nutrient.nutrient_id, formulation.origNutrientTargets[index].maximum)
    })
  }

  const handleManualOptimize = async () => {
    const currentNutrients = formulationRealTime?.nutrients || []
    const currentIngredients = formulationRealTime?.ingredients || []
    setIsLoading(true)
    try {
      const ids = currentIngredients.map((ing) => ing.ingredient_id || ing._id)
      const response = await fetch(`${VITE_API_URL}/ingredient/idarray`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids })
      })
      const data = await response.json()
      if (data.message === 'success') {
        const detailed = data.ingredients
        setDetailedIngredients(detailed)
        const dmNutrientId = currentNutrients[currentNutrients.length - 1]?.nutrient_id || currentNutrients[currentNutrients.length - 1]?.id
        const preparedData = currentIngredients.map((ing) => {
          const detail = detailed.find((d) => d._id === (ing.ingredient_id || ing._id))
          const dmValue = detail?.nutrients?.find((n) => n.nutrient === dmNutrientId)?.value || 0
          const ratio = Number(ing.minimum || 0)
          const asFed = dmValue > 0 ? (ratio / dmValue) * 100 : 0
          return { ...ing, detail, dmValue, asFed }
        })
        const totalAsFed = preparedData.reduce((sum, item) => sum + item.asFed, 0)
        const processedData = preparedData.map((item) => {
          const asFed100kg = totalAsFed > 0 ? (item.asFed / totalAsFed) * 100 : 0
          const tmrDM = (asFed100kg * item.dmValue) / 100
          return { ...item, asFed100kg, tmrDM }
        })
        const totalAsFed100kg = processedData.reduce((sum, item) => sum + item.asFed100kg, 0)
        const totalTMRDM = processedData.reduce((sum, item) => sum + item.tmrDM, 0)
        const calculatedTotalWeight = ((formulation.dmintake / 100) / totalTMRDM) * 100
        let calculatedTotalCost = 0
        const optimizedIngredients = processedData.map((item) => {
          const finalValueKg = totalAsFed100kg > 0 ? (item.asFed100kg / totalAsFed100kg) * calculatedTotalWeight : 0
          calculatedTotalCost += Number(item.detail?.price || 0) * finalValueKg
          return { name: item.name, ingredient_id: item.ingredient_id || item._id, value: finalValueKg }
        })
        const optimizedNutrients = currentNutrients.map((nut) => {
          const nutId = nut.nutrient_id || nut._id
          const totalNutrientAchieved = processedData.reduce((sum, item, idx) => {
            const ingredientValueGrams = optimizedIngredients[idx].value
            const nutEntry = item.detail?.nutrients?.find((n) => n.nutrient === nutId)
            const nutValue = Number(nutEntry?.value || 0) / 100
            const dryMatterKg = (ingredientValueGrams / 1000) * (item.dmValue / 100)
            return sum + dryMatterKg * nutValue * 1000
          }, 0)
          return { name: nut.name, value: totalNutrientAchieved }
        })
        setOptimizationResults({ ingredients: optimizedIngredients, nutrients: optimizedNutrients, totalWeight: calculatedTotalWeight, totalCost: calculatedTotalCost })
      }
    } catch (error) {
      console.error('Error calculating manual formulation:', error)
    } finally {
      setIsLoading(false)
      setIsManualFormulationOpen(true)
    }
  }

  const handleOptimize = async (type) => {
    try {
      const currentWeight = formulationRealTime?.weight || []
      const currentNutrients = formulationRealTime?.nutrients || []
      const currentIngredients = formulationRealTime?.ingredients || []
      const ingredientsInGrams = currentIngredients.map((ing) => ({ ...ing, minimum: ing.minimum * 1000, maximum: ing.maximum * 1000 }))
      let weightinGrams = currentWeight * 1000
      if (currentWeight === 0) weightinGrams = ' '
      const res = await axios.post(`${VITE_API_URL}/optimize/simplex`, {
        userId: owner?.userId,
        ingredients: ingredientsInGrams,
        nutrients: currentNutrients,
        weight: weightinGrams,
        nutrientRatioConstraints,
        type
      })
      const optimizedCost = res.data.optimizedCost
      const optimizedIngredients = res.data.optimizedIngredients
      const optimizedNutrients = res.data.optimizedNutrients
      const shadowPricesResult = res.data.shadowPrices
      const amountFed = parseFloat(res.data.weight / 1000).toFixed(2)
      updateShadowPrices(shadowPricesResult || [])
      updateCost(optimizedCost / 1000)
      optimizedIngredients.forEach((ing) => {
        const originalIng = currentIngredients.find((i) => i.name === ing.name)
        if (originalIng) updateIngredientProperty(originalIng.ingredient_id, 'value', Number(ing.value) / 1000)
      })
      optimizedNutrients.forEach((nut) => {
        const nutrientId = currentNutrients.find((n) => n.name === nut.name)?.nutrient_id
        if (nutrientId) updateNutrientProperty(nutrientId, 'value', Number(nut.value))
      })
      updateWeight(amountFed)
      setOptimizationResults({ ingredients: optimizedIngredients, nutrients: optimizedNutrients, totalWeight: amountFed, totalCost: optimizedCost / 1000 })
      setIsDirty(false)
      setIsResultsModalOpen(true)
      setRecentFormulation('Success')
    } catch (err) {
      setRecentFormulation('Fail')
      if (err.response?.data?.status === 'No optimal solution') {
        setShowToast(true)
        setMessage(t('No feasible formula found. Please adjust your constraints.'))
        setToastAction('error')
        const currentIngredients = formulationRealTime?.ingredients || []
        const currentNutrients = formulationRealTime?.nutrients || []
        currentIngredients.forEach((ing) => updateIngredientProperty(ing.ingredient_id, 'value', 0))
        currentNutrients.forEach((nut) => updateNutrientProperty(nut.nutrient_id, 'value', 0))
        const d = err.response.data
        setInfeasibilityModal({
          isOpen: true,
          data: {
            priorityAdvice: d.priorityAdvice,
            suggestion: d.suggestion,
            structuralIssues: d.structuralIssues || [],
            nutrientIssues: d.nutrientIssues || [],
            smartIngredientSuggestions: d.smartIngredientSuggestions || [],
          }
        })
      }
    }
  }

  const handleEditNutrientRatio = (index) => {
    setEditingNutrientRatioIndex(index)
    setNutrientRatioToEdit(nutrientRatioConstraints[index])
    setNutrientRatioModifyType('Edit')
    setIsChooseNutrientRatiosModalOpen(true)
  }

  const handleUpdateNutrientRatio = (updatedRatio) => {
    const updatedConstraints = [...nutrientRatioConstraints]
    updatedConstraints[editingNutrientRatioIndex] = updatedRatio
    updateNutrientRatioConstraints(updatedConstraints)
    setEditingNutrientRatioIndex(null)
    setNutrientRatioToEdit(null)
  }

  const handleDeleteNutrientRatio = (index) => {
    updateNutrientRatioConstraints(nutrientRatioConstraints.filter((_, i) => i !== index))
  }

  function showNutrientsMissingBasedonIngredientsPresent() {
    if (selectedIngredients.length === 0) {
      setMissingNutrientsValue((formulation.nutrients || []).map((n) => n.name))
      return
    }
    const ingredientIds = selectedIngredients.map((ing) => ing.ingredient_id || ing._id)
    axios.post(`${VITE_API_URL}/ingredient/idarray`, { ids: ingredientIds })
      .then((res) => res.data.ingredients)
      .then((ingredientswithnutri) => {
        if (!ingredientswithnutri || ingredientswithnutri.length === 0) {
          setMissingNutrientsValue((formulation.nutrients || []).map((n) => n.name))
          return
        }
        const allNutrientInFormulationId = (formulation.nutrients || []).reduce((acc, nutrient) => {
          acc[nutrient.nutrient_id] = 0
          return acc
        }, {})
        ;(formulation.nutrients || []).forEach((formulationnutrient) => {
          ingredientswithnutri.forEach((ingredient) => {
            ;(ingredient.nutrients || []).forEach((nutrient) => {
              if (nutrient.nutrient === formulationnutrient.nutrient_id) {
                allNutrientInFormulationId[nutrient.nutrient] += nutrient.value || 0
              }
            })
          })
        })
        const missingNutrients = Object.entries(allNutrientInFormulationId)
          .filter(([_, value]) => value === 0)
          .map(([nutrientId]) => {
            const nutrientObj = (formulation.nutrients || []).find((n) => n.nutrient_id === nutrientId)
            return nutrientObj ? nutrientObj.name : `Nutrient ID: ${nutrientId}`
          })
        setMissingNutrientsValue(missingNutrients)
      })
      .catch((err) => console.error('Error fetching ingredients by IDs:', err))
  }

  const renderIngredientsTableRows = (group) => {
    const groupFilter1 = ['grass', 'legumes']
    const groupFilter2 = ['agricultural by-products', 'industrial by-products']
    const groupFilter3 = ['vitamin-mineral']
    const filtered = ingredients.filter((ingredient) => {
      if (group === 'roughage') return groupFilter1.some((g) => ingredient.group?.toLowerCase().includes(g.toLowerCase()))
      if (group === 'concentrate') return groupFilter2.some((g) => ingredient.group?.toLowerCase().includes(g.toLowerCase()))
      if (group === 'vitamins') return groupFilter3.some((g) => ingredient.group?.toLowerCase().includes(g.toLowerCase()))
      return ingredient
    })
    const isLimitVisible = group === 'roughage' ? showRoughageLimits : group === 'concentrate' ? showConcentrateLimits : showVitaminLimits
    if (filtered.length > 0) {
      return (
        <>
          {filtered.map((ingredient, index) => (
            <tr key={index} className="hover:bg-base-200 transition-colors border-b border-gray-50">
              <td
                className="text-gray-700 hover:bg-green-button items-center rounded text-sm font-medium hover:text-white cursor-pointer"
                onClick={() => handleIngredientClick(ingredient)}
              >
                {ingredient.name}
              </td>
              {isLimitVisible && (
                <>
                  <td className="text-center">
                    <input
                      type="text"
                      className="input input-bordered input-xs w-16 text-center rounded-md"
                      disabled={isDisabled}
                      value={ingredient.minimum !== 0 ? ingredient.minimum : 'N/A'}
                      onChange={(e) => {
                        const inputValue = e.target.value
                        if (/^N\/A(\d+|\.)/.test(inputValue) || /^\d*\.?\d{0,2}$/.test(inputValue)) {
                          const processedValue = /^N\/A\d*/.test(inputValue) ? inputValue.replace('N/A', '') : inputValue
                          handleIngredientMinimumChange(ingredient.ingredient_id, processedValue)
                          setIsDirty(false)
                        }
                      }}
                    />
                  </td>
                  <td className="text-center">
                    <input
                      type="text"
                      className="input input-bordered input-xs w-16 text-center rounded-md"
                      disabled={isDisabled}
                      value={ingredient.maximum !== 0 ? ingredient.maximum : 'N/A'}
                      onChange={(e) => {
                        const inputValue = e.target.value
                        if (/^N\/A(\d+|\.)/.test(inputValue) || /^\d*\.?\d{0,2}$/.test(inputValue)) {
                          const processedValue = /^N\/A\d*/.test(inputValue) ? inputValue.replace('N/A', '') : inputValue
                          handleIngredientMaximumChange(ingredient.ingredient_id, processedValue)
                          setIsDirty(false)
                        }
                      }}
                    />
                  </td>
                </>
              )}
              <td className="font-semibold text-gray-800">
                {ingredient ? `${(ingredient.value || 0).toFixed(3)} kg` : '0.000 kg'}
              </td>
              <td className="text-right">
                <button
                  disabled={isDisabled}
                  className={`${isDisabled ? 'hidden' : ''} btn btn-ghost btn-xs text-red-500 hover:bg-red-100 rounded-lg`}
                  onClick={() => handleRemoveIngredient(ingredient)}
                >
                  <RiDeleteBinLine size={14} />
                </button>
              </td>
            </tr>
          ))}
        </>
      )
    }
  }

  const renderNutrientsTableRows = () => {
    if (nutrients) {
      return nutrients.map((nutrient, index) => (
        <tr key={nutrient.nutrient_id} className="hover:bg-base-300">
          <td>{nutrient.name}</td>
          <td>
            <input
              type="text"
              className="input input-bordered input-xs w-15"
              disabled={isDisabled}
              value={nutrient.minimum !== 0 ? nutrient.minimum : 'N/A'}
              onChange={(e) => {
                const inputValue = e.target.value
                if (/^N\/A(\d+|\.)/.test(inputValue) || /^\d*\.?\d{0,2}$/.test(inputValue)) {
                  const processedValue = /^N\/A\d*/.test(inputValue) ? inputValue.replace('N/A', '') : inputValue
                  handleNutrientMinimumChange(nutrient.nutrient_id, processedValue)
                  setIsDirty(false)
                }
              }}
              onFocus={() => updateMyPresence({ focusedId: `nutrient-${index}-minimum` })}
              onBlur={() => updateMyPresence({ focusedId: null })}
            />
            <Selections id={`nutrient-${index}-minimum`} others={others} />
          </td>
          <td>
            <input
              type="text"
              className="input input-bordered input-xs w-15"
              disabled={isDisabled}
              value={nutrient.maximum !== 0 ? nutrient.maximum : 'N/A'}
              onChange={(e) => {
                const inputValue = e.target.value
                if (/^N\/A(\d+|\.)/.test(inputValue) || /^\d*\.?\d{0,2}$/.test(inputValue)) {
                  const processedValue = /^N\/A\d*/.test(inputValue) ? inputValue.replace('N/A', '') : inputValue
                  handleNutrientMaximumChange(nutrient.nutrient_id, processedValue)
                  setIsDirty(false)
                }
              }}
              onFocus={() => updateMyPresence({ focusedId: `nutrient-${index}-maximum` })}
              onBlur={() => updateMyPresence({ focusedId: null })}
            />
            <Selections id={`nutrient-${index}-maximum`} others={others} />
          </td>
          <td>{nutrient.value.toFixed(3)}</td>
          <td>
            <button
              disabled={isDisabled}
              className={`${isDisabled ? 'hidden' : ''} btn btn-ghost btn-xs text-red-500 hover:bg-red-200`}
              onClick={() => handleRemoveNutrient(nutrient)}
            >
              <RiDeleteBinLine />
            </button>
          </td>
        </tr>
      ))
    }
  }

  const renderNutrientRatiosTableRows = () => {
    if (nutrientRatioConstraints) {
      return nutrientRatioConstraints.map((nutrient, index) => (
        <tr key={index} className="hover:bg-base-300">
          <td className="w-1/5">{nutrient.firstIngredient}</td>
          <td className="w-1/5">{nutrient.secondIngredient}</td>
          <td className="w-1/5 text-center">{nutrient.operator || '='}</td>
          <td className="w-1/5 text-center">{nutrient.firstIngredientRatio} : {nutrient.secondIngredientRatio}</td>
          <td className="w-1/5 text-center">
            <div className="flex items-center justify-center gap-2">
              <button className="btn btn-ghost btn-xs text-deepbrown hover:bg-deepbrown/10 items-center gap-1" disabled={isDisabled} onClick={() => handleEditNutrientRatio(index)}>
                <RiPencilLine className="h-4 w-4 text-deepbrown" />
              </button>
              <button disabled={isDisabled} className={`${isDisabled ? 'hidden' : ''} btn btn-ghost btn-xs text-red-500 hover:bg-red-200 ml-1`} onClick={() => handleDeleteNutrientRatio(index)}>
                <RiDeleteBinLine />
              </button>
            </div>
          </td>
        </tr>
      ))
    }
  }

  if (isLoading || formulation.length === 0 || !owner) return <Loading />
  if (!formulationRealTime) return <Loading />

  const { weight, code, name, description, animal_group, cost } = formulationRealTime
  const nutrients = formulationRealTime?.nutrients || []
  const ingredients = formulationRealTime?.ingredients || []

  return (
    <div className="flex h-full flex-col bg-gray-50 md:flex-row">
      <div className="flex-1 p-4">
        <div className="space-y-2">
          {/* Header */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <h1 className="text-deepbrown text-xl font-bold md:text-2xl">
                {t('Feed Formulation (Group)')}
              </h1>

              {/* Step progress */}
              <div className="flex flex-row items-center space-x-2 md:space-x-4 mb-4 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-2 shrink-0">
                  <h1 className="text-gray-300 text-xs font-bold md:text-sm uppercase tracking-wider">{t('Select/Create')}</h1>
                  <RiArrowRightSLine className="text-gray-300 h-5 w-5" />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex flex-col items-center">
                    <h1 className="text-deepbrown text-xs font-bold md:text-sm uppercase tracking-wider">{t('Formulate')}</h1>
                    <div className="h-1 w-full bg-deepbrown rounded-full mt-0.5 animate-pulse" />
                  </div>
                  <RiArrowRightSLine className="text-gray-300 h-5 w-5" />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <h1 className="text-gray-300 text-xs font-bold md:text-sm uppercase tracking-wider">{t('Generate')}</h1>
                </div>
              </div>

              {/* Mobile toggle buttons */}
              {isLargeOrSmaller && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleTab('tools')}
                    className={`btn btn-sm border rounded-xl gap-2 transition-all ${activeTab === 'tools' ? 'bg-deepbrown text-white border-deepbrown' : 'bg-white text-deepbrown border-gray-200'}`}
                  >
                    <RiSettings4Line className={activeTab === 'tools' ? 'rotate-90' : ''} />
                    <span className="text-xs">{t('Compute')}</span>
                    <RiArrowDownSLine className={activeTab === 'tools' ? 'rotate-180' : ''} />
                  </button>
                  <button
                    onClick={() => toggleTab('details')}
                    className={`btn btn-sm border rounded-xl gap-2 transition-all ${activeTab === 'details' ? 'bg-deepbrown text-white border-deepbrown' : 'bg-white text-deepbrown border-gray-200'}`}
                  >
                    <RiInformationLine className={activeTab === 'details' ? 'text-white' : 'text-green-button'} />
                    <span className="text-xs">{t('Details')}</span>
                    <RiArrowDownSLine className={activeTab === 'details' ? 'rotate-180' : ''} />
                  </button>
                </div>
              )}
            </div>

            <div className="relative">
              {/* Tools / Compute Panel */}
              <AnimatePresence>
                {(activeTab === 'tools' || !isLargeOrSmaller) && (
                  <motion.div
                    initial={isLargeOrSmaller ? { height: 0, opacity: 0 } : false}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="relative z-[30]"
                    style={{ overflow: 'visible' }}
                  >
                    <div className="relative z-20 flex flex-col gap-3 sm:flex-row-reverse sm:items-center sm:justify-between bg-white p-3 rounded-2xl border border-gray-100 shadow-sm md:mb-2">
                      {/* Avatars row */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 pb-2 sm:pb-0 border-b border-gray-50 sm:border-none">
                        <div className="flex space-x-2 shrink-0">
                          {others.map(({ connectionId, info }) => (
                            <Avatar key={connectionId} src={info.avatar} name={info.name} />
                          ))}
                          <Avatar src={self.info.avatar} name={t('You')} />
                        </div>
                      </div>

                      {/* Core tools */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 sm:pt-0">
                        {/* Optimize Dropdown */}
                        {constraintMode !== 'percent' && (
                          <div className="dropdown dropdown-bottom dropdown-start">
                            <div tabIndex={0} role="button" className="btn bg-green-button border-none text-white btn-sm gap-2 rounded-xl shadow-sm">
                              <RiCalculatorLine /> <span className="inline">{t('Optimize')}</span>
                            </div>
                            <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-[100] w-52 p-2 shadow-xl border border-base-200 mt-2">
                              <li><button className="py-2.5 text-xs" onClick={() => handleOptimize('simplex-dry-matter')}>{t('Simplex Hard Constraint')}</button></li>
                            </ul>
                          </div>
                        )}

                        {/* Formulations Modal */}
                        <button
                          className="btn btn-sm border border-gray-300 bg-white gap-2 rounded-xl text-xs"
                          onClick={() => setViewFormulationsModalOpen(true)}
                        >
                          <RiStackLine /> <span className="hidden sm:inline">{t('See Formulations')}</span>
                        </button>

                        {/* Latest Results */}
                        {recentFormulation === 'Success' && (
                          <div className="hidden lg:flex items-center gap-2">
                            <button className="btn border-green-200 bg-green-50 hover:bg-green-100 btn-sm gap-2 rounded-xl text-xs px-3 font-bold text-green-700 transition-all" onClick={() => setIsResultsModalOpen(true)}>
                              <RiHistoryLine className="animate-pulse" /> {t('Latest Results')}
                            </button>
                          </div>
                        )}
                        {recentFormulation === 'Fail' && (
                          <div className="hidden lg:flex items-center gap-2">
                            <button className="btn border-red-200 bg-red-50 hover:bg-red-100 btn-sm gap-2 rounded-xl text-xs px-3 font-bold text-red-700 transition-all" onClick={() => setInfeasibilityModal((prev) => ({ ...prev, isOpen: true }))}>
                              <RiHistoryLine className="animate-pulse" /> {t('Latest Results')}
                            </button>
                          </div>
                        )}

                        {/* More menu (mobile) + Shadow Prices + Advanced toggle */}
                        <div className="flex items-center gap-2">
                          <div className="dropdown dropdown-bottom dropdown-end lg:hidden">
                            <div tabIndex={0} role="button" className="btn btn-ghost btn-sm border border-gray-300 rounded-xl px-2">
                              <RiMore2Fill size={20} className="text-deepbrown" />
                            </div>
                            <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-[100] w-48 p-2 shadow-xl border border-base-200 mt-2">
                              <li><button className="text-xs" onClick={() => setShadowPricingTabOpen(true)}><RiLineChartLine /> {t('Shadow Prices')}</button></li>
                              <li><button className="text-xs" onClick={() => setAdvancedPressed(!advancedPressed)}><RiSettings4Line /> {advancedPressed ? t('Show Basic') : t('Show Advanced')}</button></li>
                              {optimizationResults && (
                                <li><button className="text-xs" onClick={() => setIsResultsModalOpen(true)}><RiHistoryLine /> {t('Latest Results')}</button></li>
                              )}
                            </ul>
                          </div>
                          <div className="hidden lg:flex items-center gap-2">
                            <button className="btn border border-gray-300 bg-white btn-sm gap-2 rounded-xl text-xs px-3 font-medium" onClick={() => setShadowPricingTabOpen(true)}>
                              <RiLineChartLine /> {t('Shadow Prices')}
                            </button>
                          </div>
                          <div className="hidden lg:flex items-center gap-2">
                            <button className="btn border border-gray-300 bg-white btn-sm gap-2 rounded-xl text-xs px-3 font-medium" onClick={() => setAdvancedPressed(!advancedPressed)}>
                              <RiSettings4Line /> {advancedPressed ? t('Show Basic') : t('Show Advanced')}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Group Formulation Details Panel (replaces Edit panel — read-only) */}
              <AnimatePresence>
                {(activeTab === 'details' || (!isLargeOrSmaller && window.innerWidth >= 768)) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden bg-white rounded-2xl border border-gray-100 shadow-sm mt-2"
                  >
                    <div className="px-4 md:px-6 pt-4 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <h3 className="text-sm font-bold text-deepbrown uppercase tracking-wider">{t('Formulation Summary')}</h3>
                        <button
                          onClick={() => setShowAllDetails(!showAllDetails)}
                          className="hidden md:flex btn btn-ghost btn-xs text-deepbrown/50 hover:bg-gray-100 gap-1 normal-case"
                        >
                          {showAllDetails ? t('Show less') : t('View more details')}
                          <svg className={`transition-transform duration-200 ${showAllDetails ? 'rotate-180' : ''}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                        </button>
                      </div>
                    </div>
                    <div className="p-4 md:p-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4">
                        <div className="col-span-1">
                          <p className="text-[10px] font-bold text-gray-400 uppercase">{t('Group Name')}</p>
                          <p className="text-sm font-semibold text-deepbrown truncate">{groupFormulationName || '—'}</p>
                        </div>
                        <div className="col-span-1 md:col-span-2">
                          <p className="text-[10px] font-bold text-gray-400 uppercase">{t('Animal Group')}</p>
                          <p className="text-sm font-semibold text-deepbrown">{formulation.animal_group || '—'}</p>
                        </div>
                        <div className="col-span-1">
                          <p className="text-[10px] font-bold text-gray-400 uppercase">{t('Body Weight')}</p>
                          <p className="text-sm font-semibold text-deepbrown">{formulation.body_weight || 0} <span className="text-xs font-normal text-gray-500">kg</span></p>
                        </div>
                      </div>
                      <motion.div
                        initial={false}
                        animate={{ height: (showAllDetails || window.innerWidth < 768) ? 'auto' : 0, opacity: (showAllDetails || window.innerWidth < 768) ? 1 : 0 }}
                        className="overflow-hidden"
                      >
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-5 mt-5 pt-5 border-t border-gray-50">
                          <div className="col-span-2 md:col-span-4">
                            <p className="text-[10px] font-bold text-gray-400 uppercase">{t('Description')}</p>
                            <p className="text-sm text-deepbrown italic">{groupFormulationDescription || t('No description provided.')}</p>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {isDirty && (
              <div className="alert alert-error alert-soft text-sm py-2">
                <Warning />
                <span>{t('Formula constraints changed. Optimize and Save.')}</span>
              </div>
            )}
          </div>

          {/* Missing nutrients */}
          {missingNutrientsValue.length > 0 && (
            <div className="my-4">
              <div className="rounded-lg border border-yellow-400 bg-yellow-50 p-3 shadow-sm">
                <div className="font-semibold text-yellow-700 mb-2 flex items-center gap-2">
                  <Warning /> {t('Nutrients Still Missing')}
                </div>
                <ul className="list-disc pl-5 text-sm text-yellow-800">
                  {missingNutrientsValue.map((n, i) => <li key={i}>{n}</li>)}
                </ul>
              </div>
            </div>
          )}

          {/* ======================== BASIC VIEW ======================== */}
          {!advancedPressed ? (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Roughage */}
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                  <div className="p-4 pb-2">
                    <h3 className="mb-1 text-sm font-semibold">{t('Roughage (Approx. 70% of total feed)')}</h3>
                    <p className="flex items-center gap-1 text-xs text-gray-500"><Info /> {t('Contains Grasses, Legumes, and other by-products.')}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <input type="checkbox" id="toggle-roughage-limits" className="checkbox checkbox-success checkbox-xs rounded-md" checked={showRoughageLimits} onChange={(e) => setShowRoughageLimits(e.target.checked)} />
                      <label htmlFor="toggle-roughage-limits" className="cursor-pointer text-[11px] font-medium text-gray-600 uppercase tracking-wider">{t('Add/Show Amount Limit')}</label>
                    </div>
                  </div>
                  <div className="max-h-64 overflow-x-auto overflow-y-auto">
                    <table className="table-sm table-pin-rows table w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th>{t('Name')}</th>
                          {showRoughageLimits && (<><th className="text-center">{t('Min (kg)')}</th><th className="text-center">{t('Max (kg)')}</th></>)}
                          <th>{t('Amount (kg)')}</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>{renderIngredientsTableRows('roughage')}</tbody>
                    </table>
                  </div>
                  <div className="p-4 border-t border-gray-100">
                    <button disabled={isDisabled} onClick={() => { setIsChooseIngredientsModalOpen(true); setFilterIngredientCode('roughage') }} className="bg-green-button flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm text-white transition-colors hover:bg-green-600 active:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300">
                      <RiAddLine /> {t('Add Roughage')}
                    </button>
                  </div>
                </div>

                {/* Concentrate */}
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                  <div className="p-4">
                    <h3 className="mb-1 text-sm font-semibold">{t('Concentrate (Approx. 27% of total feed)')}</h3>
                    <p className="flex text-xs text-gray-500 mb-2"><Info /> {t('Contains Food with Concentrated Nutrients (27% max)')}</p>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="toggle-concentrate-limits" className="checkbox checkbox-success checkbox-xs rounded-md" checked={showConcentrateLimits} onChange={(e) => setShowConcentrateLimits(e.target.checked)} />
                      <label htmlFor="toggle-concentrate-limits" className="cursor-pointer text-[11px] font-medium text-gray-600 uppercase tracking-wider">{t('Add/Show Amount Limit')}</label>
                    </div>
                  </div>
                  <div className="max-h-64 overflow-x-auto overflow-y-auto">
                    <table className="table-sm table-pin-rows table w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="text-sm">{t('Name')}</th>
                          {showConcentrateLimits && (<><th className="text-center text-sm">{t('Min (kg)')}</th><th className="text-center text-sm">{t('Max (kg)')}</th></>)}
                          <th className="text-sm">{t('Amount (kg)')}</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>{renderIngredientsTableRows('concentrate')}</tbody>
                    </table>
                  </div>
                  <div className="p-4 border-t border-gray-100">
                    <button disabled={isDisabled} onClick={() => { setIsChooseIngredientsModalOpen(true); setFilterIngredientCode('concentrate') }} className="bg-green-button flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm text-white transition-colors hover:bg-green-600 active:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300">
                      <RiAddLine /> {t('Add Concentrate')}
                    </button>
                  </div>
                </div>
              </div>

              {/* Vitamins */}
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="p-4">
                  <h3 className="mb-2 text-sm font-semibold">{t('Mineral Supplement (Approx. 3% of total feed)')}</h3>
                  <p className="flex text-xs text-gray-500 mb-3"><Info /> {t('Contains Minerals.')}</p>
                  <div className="flex items-center gap-2 mb-1">
                    <input type="checkbox" id="toggle-vitamin-limits" className="checkbox checkbox-success checkbox-xs rounded-md" checked={showVitaminLimits} onChange={(e) => setShowVitaminLimits(e.target.checked)} />
                    <label htmlFor="toggle-vitamin-limits" className="cursor-pointer text-[11px] font-medium text-gray-600 uppercase tracking-wider">{t('Add/Show Amount Limit')}</label>
                  </div>
                </div>
                <div className="max-h-64 overflow-x-auto overflow-y-auto">
                  <table className="table-sm table-pin-rows table w-full">
                    <thead>
                      <tr className="bg-gray-50 text-xs">
                        <th>{t('Name')}</th>
                        {showVitaminLimits && (<><th className="text-center">{t('Min (kg)')}</th><th className="text-center">{t('Max (kg)')}</th></>)}
                        <th>{t('Amount (kg)')}</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>{renderIngredientsTableRows('vitamins')}</tbody>
                  </table>
                </div>
                <div className="p-4 border-t border-gray-100">
                  <button disabled={isDisabled} onClick={() => { setIsChooseIngredientsModalOpen(true); setFilterIngredientCode('vitamins') }} className="bg-green-button flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm text-white transition-colors hover:bg-green-600 active:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300">
                    <RiAddLine /> {t('Add Vitamins Minerals')}
                  </button>
                </div>
              </div>
            </>
          ) : (
            // ======================== ADVANCED VIEW ========================
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                {/* All Ingredients table */}
                <div className={`overflow-hidden rounded-xl border border-gray-200 bg-white ${constraintMode === 'percent' ? 'sm:lg:col-span-5 lg:col-span-2' : 'sm:col-span-5 lg:col-span-3'}`}>
                  <div className="p-4">
                    <div className="mb-2 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                      <h3 className="text-sm font-semibold">{t('All Ingredients (kg)')}</h3>
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('Constraints:')}</label>
                        <select className="select select-bordered select-xs rounded-lg font-medium text-deepbrown" value={constraintMode} onChange={(e) => setConstraintMode(e.target.value)}>
                          <option value="none">{t('No Limits/Hide Limits')}</option>
                          <option value="kg">{t('Fixed')}</option>
                          <option value="percent">{t('Manual Percentage (%)')}</option>
                        </select>
                      </div>
                    </div>
                    <p className="flex items-center gap-1 text-xs text-gray-500">
                      <Info size={14} />
                      <span>{constraintMode === 'percent' ? t('Enter constraints as % of total formulation weight.') : t('Shows all ingredients in the formulation in kilograms.')}</span>
                    </p>
                  </div>
                  <div className="max-h-64 overflow-x-auto overflow-y-auto no-scrollbar">
                    <table className="table-sm table-pin-rows table w-full">
                      <thead>
                        <tr>
                          <th className="text-deepbrown">{t('Name')}</th>
                          {constraintMode !== 'none' && (
                            <>
                              <th className="text-deepbrown text-center">{constraintMode === 'percent' ? '(%)' : t('Min (kg)')}</th>
                              {constraintMode !== 'percent' && <th className="text-deepbrown text-center">{t('Max (kg)')}</th>}
                            </>
                          )}
                          <th className="text-deepbrown">{t('Classification')}</th>
                          {constraintMode !== 'percent' && (
                            <>
                              <th className="text-deepbrown">{t('Amount (kg)')}</th>
                              <th className="text-deepbrown">{t('Total (%)')}</th>
                            </>
                          )}
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {ingredients.map((ingredient, index) => (
                          <tr key={index} className="hover:bg-base-200/50 transition-colors">
                            <td
                              className="text-gray-700 hover:bg-green-button items-center rounded text-sm font-medium hover:text-white cursor-pointer"
                              onClick={() => handleIngredientClick(ingredient)}
                            >
                              {ingredient.name}
                            </td>
                            {constraintMode !== 'none' && (
                              <>
                                <td>
                                  <div className="relative flex items-center">
                                    <input
                                      type="text"
                                      className="input input-bordered input-xs w-20 pr-6"
                                      placeholder="N/A"
                                      value={ingredient.minimum || ''}
                                      onChange={(e) => {
                                        const inputValue = e.target.value
                                        if (/^N\/A(\d+|\.)/.test(inputValue) || /^\d*\.?\d{0,2}$/.test(inputValue)) {
                                          const processedValue = /^N\/A\d*/.test(inputValue) ? inputValue.replace('N/A', '') : inputValue
                                          handleIngredientMinimumChange(ingredient.ingredient_id, processedValue)
                                        }
                                      }}
                                    />
                                    {constraintMode === 'percent' && <span className="absolute right-2 text-[10px] text-gray-400">%</span>}
                                  </div>
                                </td>
                                {constraintMode !== 'percent' && (
                                  <td>
                                    <div className="relative flex items-center">
                                      <input
                                        type="text"
                                        className="input input-bordered input-xs w-20 pr-6"
                                        placeholder="N/A"
                                        value={ingredient.maximum || ''}
                                        onChange={(e) => {
                                          const inputValue = e.target.value
                                          if (/^N\/A(\d+|\.)/.test(inputValue) || /^\d*\.?\d{0,2}$/.test(inputValue)) {
                                            const processedValue = /^N\/A\d*/.test(inputValue) ? inputValue.replace('N/A', '') : inputValue
                                            handleIngredientMaximumChange(ingredient.ingredient_id, processedValue)
                                          }
                                        }}
                                      />
                                    </div>
                                  </td>
                                )}
                              </>
                            )}
                            <td className="text-gray-500 text-xs uppercase">{ingredient.group}</td>
                            {constraintMode !== 'percent' && (
                              <>
                                <td className="font-mono font-bold text-deepbrown">{ingredient.value.toFixed(3)} kg</td>
                                <td className="font-mono font-bold text-deepbrown">{weight > 0 ? ((ingredient.value / weight) * 100).toFixed(1) : '0.0'} %</td>
                              </>
                            )}
                            <td className="text-right">
                              <button disabled={isDisabled} className="btn btn-ghost btn-xs text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleRemoveIngredient(ingredient)}>
                                <RiDeleteBinLine size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-4 border-t border-gray-50 bg-gray-50/50 flex flex-row space-x-5">
                    <button disabled={isDisabled} onClick={() => setIsChooseIngredientsModalOpen(true)} className="bg-green-button flex items-center gap-2 rounded-xl px-4 py-2 text-sm text-white shadow-sm hover:bg-green-600 active:transform active:scale-95 transition-all disabled:bg-gray-300">
                      <RiAddLine /> {t('Add ingredient')}
                    </button>
                    {constraintMode === 'percent' && (
                      <button disabled={isDisabled} onClick={() => handleManualOptimize()} className="bg-yellow-400 flex items-center gap-2 rounded-xl px-4 py-2 text-sm text-deepbrown shadow-sm hover:bg-green-600 active:transform active:scale-95 transition-all disabled:bg-gray-300">
                        <RiCalculatorLine /> {t('Manual Solve')}
                      </button>
                    )}
                  </div>
                </div>

                {/* Manual Formulation panel */}
                {constraintMode === 'percent' && (
                  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white sm:mt-0 mt-4 md:col-span-3">
                    <ManualFormulation
                      isOpen={isManualFormulationOpen}
                      onClose={() => setIsManualFormulationOpen(false)}
                      results={optimizationResults}
                      onGenerateReport={() => { setIsResultsModalOpen(false); setIsCustomizationModalOpen(true) }}
                      formulation={formulationRealTime}
                    />
                  </div>
                )}

                {/* Nutrients section */}
                {constraintMode !== 'percent' && (
                  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white sm:mt-0 mt-4 sm:col-span-5 lg:col-span-2">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold">{t('Nutrients (g)')}</h3>
                          <button onClick={() => setIsPCCModalOpen(true)} className="btn btn-ghost btn-xs text-blue-600 hover:bg-blue-50 flex items-center gap-1">
                            <RiBookLine /> {t('Reference:')} <div className="lg:block hidden">{t('PCC Book')}</div>
                          </button>
                          <button onClick={() => resetFormulationToInitialState()} className="btn btn-ghost btn-xs text-red-600 hover:bg-blue-50 flex items-center gap-1">
                            <RiBookLine /> {t('Reset')} <div className="lg:block hidden">{t('to PCC Reference')}</div>
                          </button>
                        </div>
                      </div>
                      <p className="flex text-xs text-gray-500"><Info className="mr-1" /> {t('Shows all nutrients in the formulation in grams.')}</p>
                    </div>
                    <div className="max-h-64 overflow-x-auto overflow-y-auto">
                      <table className="table-sm table-pin-rows table w-full">
                        <thead>
                          <tr>
                            <th>{t('Name')}</th>
                            <th>{t('Min (g)')}</th>
                            <th>{t('Max (g)')}</th>
                            <th>{t('Amount (g)')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {nutrients.map((nutrient, index) => (
                            <tr key={nutrient.nutrient_id || index} className="hover:bg-base-300">
                              <td className="font-medium">{nutrient.name}</td>
                              <td>
                                <div className="relative">
                                  <input
                                    id={`nutrient-${index}-minimum`}
                                    type="text"
                                    className="input input-bordered input-xs w-20"
                                    disabled={isDisabled}
                                    value={nutrient.minimum !== 0 ? nutrient.minimum : 'N/A'}
                                    onChange={(e) => {
                                      const inputValue = e.target.value
                                      if (/^N\/A(\d+|\.)/.test(inputValue) || /^\d*\.?\d{0,2}$/.test(inputValue)) {
                                        const processedValue = /^N\/A\d*/.test(inputValue) ? inputValue.replace('N/A', '') : inputValue
                                        handleNutrientMinimumChange(nutrient.nutrient_id, processedValue)
                                        setIsDirty(false)
                                      }
                                    }}
                                    onFocus={() => updateMyPresence({ focusedId: `nutrient-${index}-minimum` })}
                                    onBlur={() => updateMyPresence({ focusedId: null })}
                                  />
                                  <Selections id={`nutrient-${index}-minimum`} others={others} />
                                </div>
                              </td>
                              <td>
                                <div className="relative">
                                  <input
                                    id={`nutrient-${index}-maximum`}
                                    type="text"
                                    className="input input-bordered input-xs w-20"
                                    disabled={isDisabled}
                                    value={nutrient.maximum !== 0 ? nutrient.maximum : 'N/A'}
                                    onChange={(e) => {
                                      const inputValue = e.target.value
                                      if (/^N\/A(\d+|\.)/.test(inputValue) || /^\d*\.?\d{0,2}$/.test(inputValue)) {
                                        const processedValue = /^N\/A\d*/.test(inputValue) ? inputValue.replace('N/A', '') : inputValue
                                        handleNutrientMaximumChange(nutrient.nutrient_id, processedValue)
                                        setIsDirty(false)
                                      }
                                    }}
                                    onFocus={() => updateMyPresence({ focusedId: `nutrient-${index}-maximum` })}
                                    onBlur={() => updateMyPresence({ focusedId: null })}
                                  />
                                  <Selections id={`nutrient-${index}-maximum`} others={others} />
                                </div>
                              </td>
                              <td className="text-gray-600">{nutrient.value.toFixed(3)} g</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* PCC Reference Modal */}
                    {isPCCModalOpen && (
                      <div className="modal modal-open">
                        <div className="modal-box max-w-md">
                          <h3 className="font-bold text-lg mb-1">{t('Formulation Information (PCC Book)')}</h3>
                          <h3 className="font-medium text-sm mb-4">{t("Other changes may be due to carabao's special phases (ie. Mid-Lactation, Late Pregnancy)")}</h3>
                          <h3 className="font-medium text-xs mb-4">{t('Minimum is 20% lower than actual value and maximum is 20% higher')}</h3>
                          <div className="space-y-2">
                            <div className="grid grid-cols-2 border-b pb-2 text-xs font-bold uppercase text-gray-500">
                              <span>{t('Nutrient')}</span>
                              <span className="text-right">{t('Reference Avg')}</span>
                            </div>
                            {formulation.origNutrientTargets.map((n) => {
                              const avg = (Number(n.minimum || 0) + Number(n.maximum || 0)) / 2
                              return (
                                <div key={n.nutrient_id} className="grid grid-cols-2 py-1 text-sm border-b border-gray-50">
                                  <span>{n.name}</span>
                                  <span className="text-right font-mono">{avg.toFixed(2)}g</span>
                                </div>
                              )
                            })}
                          </div>
                          <div className="modal-action">
                            <button className="btn btn-sm" onClick={() => setIsPCCModalOpen(false)}>{t('Close')}</button>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="p-4">
                      <button disabled={isDisabled} onClick={() => setIsChooseNutrientsModalOpen(true)} className="bg-green-button flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm text-white transition-colors hover:bg-green-600 active:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300">
                        <RiAddLine /> {t('Add nutrient')}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Nutrient Ratio Constraints */}
              {constraintMode !== 'percent' && (
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white mt-4">
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <h3 className="mb-2 text-sm font-semibold">{t('Nutrient Ratio Constraints')}</h3>
                      <p className="flex text-xs text-gray-500"><Info /> {t('Set constraints between two nutrients (e.g., Protein : Fat ≥ 2:1).')}</p>
                    </div>
                    <button disabled={isDisabled} onClick={() => { setNutrientRatioModifyType('add'); setIsChooseNutrientRatiosModalOpen(true) }} className="bg-green-button flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm text-white transition-colors hover:bg-green-600 active:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300">
                      <RiAddLine /> {t('Add ratio')}
                    </button>
                  </div>
                  <div className="max-h-64 overflow-x-auto overflow-y-auto">
                    <table className="table-sm table-pin-rows table w-full">
                      <thead>
                        <tr>
                          <th>{t('First Nutrient')}</th>
                          <th>{t('Second Nutrient')}</th>
                          <th>{t('Operator')}</th>
                          <th>{t('Ratio')}</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>{renderNutrientRatiosTableRows()}</tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Footer: Amount fed + Cost */}
          {constraintMode !== 'percent' ? (
            <div className="flex flex-wrap justify-end gap-2 px-4 pb-5 md:mb-0 mb-15 md:mt-0 mt-5">
              <div className="flex items-center justify-end gap-1 pr-2">
                <span className="text-sm font-medium text-gray-600">{t('Amount to be Fed (kg):')}</span>
                <span className="text-green-button text-lg font-bold underline">
                  <div>
                    <input
                      id="input-weight"
                      type="text"
                      className="input input-bordered w-[80px] rounded-xl"
                      disabled={isDisabled}
                      value={weight}
                      onFocus={(e) => updateMyPresence({ focusedId: e.target.id })}
                      onBlur={() => updateMyPresence({ focusedId: null })}
                      onChange={(e) => { if (e.target.value === '') { updateWeight(100) } else { updateWeight(e.target.value) } }}
                      maxLength={20}
                    />
                    <Selections id="input-weight" others={others} />
                  </div>
                </span>
              </div>
              <div className="flex items-center justify-end gap-1 pr-2">
                <span className="text-sm font-medium text-gray-600">{t('Total cost (per {{weight}} kg):', { weight })}</span>
                <span className="text-green-button text-lg font-bold underline">₱ {cost && cost.toFixed(2)}</span>
              </div>
            </div>
          ) : <div className="w-full mb-10 bg-white h-10"></div>}

        </div>
      </div>

      {/* Modals */}
      <ShadowPricingTab open={shadowPricingTabOpen} onClose={() => setShadowPricingTabOpen(false)} data={shadowPrices} />
      <ChooseIngredientsModal isOpen={isChooseIngredientsModalOpen} onClose={() => setIsChooseIngredientsModalOpen(false)} ingredients={ingredientsMenu} onResult={handleAddIngredients} ingredientsFilter={filterIngredientCode} />
      <ChooseNutrientsModal isOpen={isChooseNutrientsModalOpen} onClose={() => setIsChooseNutrientsModalOpen(false)} nutrients={nutrientsMenu} onResult={handleAddNutrients} />
      <ChooseNutrientRatiosModal
        isOpen={isChooseNutrientRatiosModalOpen}
        onClose={() => { setIsChooseNutrientRatiosModalOpen(false); setEditingNutrientRatioIndex(null); setNutrientRatioToEdit(null) }}
        nutrients={nutrients}
        allNutrients={listOfNutrients}
        onResult={(newRatio) => updateNutrientRatioConstraints([...(nutrientRatioConstraints || []), newRatio])}
        onUpdate={handleUpdateNutrientRatio}
        type={nutrientRatioModifyType}
        editingNutrientRatio={nutrientRatioToEdit}
      />
      <ViewFormulationsModal isOpen={viewFormulationsModalOpen} onClose={() => setViewFormulationsModalOpen(false)} formulations={formulations} />
      <Toast className="transition delay-150 ease-in-out" show={showToast} action={toastAction} message={message} onHide={hideToast} />
      <OptimizeFAB handleOptimize={handleOptimize} />
      <OptimizationResultsModal
        isOpen={isResultsModalOpen}
        results={optimizationResults}
        onClose={() => setIsResultsModalOpen(false)}
        onGenerateReport={() => { setIsResultsModalOpen(false); setIsCustomizationModalOpen(true) }}
        formulation={formulationRealTime}
      />
      <UserCustomizationModal
        isOpen={isCustomizationModalOpen}
        onClose={() => setIsCustomizationModalOpen(false)}
        onGenerate={handleGenerateReport}
        userAccess={userAccess}
        formulation={formulationRealTime}
        owner={owner}
        weight={weight}
        shadowPrices={shadowPrices}
        isCustomizationModalOpen={isCustomizationModalOpen}
        setIsCustomizationModalOpen={setIsCustomizationModalOpen}
        ispercentcompute={constraintMode === 'percent'}
      />
      <IngredientSubstituteModal isOpen={isSubModalOpen} onClose={() => setIsSubModalOpen(false)} modalData={modalData} substitutesLoading={substitutesLoading} />
      <InfeasibilityModal isOpen={infeasibilityModal.isOpen} onClose={() => setInfeasibilityModal((prev) => ({ ...prev, isOpen: false }))} diagnosisData={infeasibilityModal.data} />
    </div>
  )
}

function Selections({ id, others }) {
  return (
    <>
      {others.map(({ connectionId, info, presence }) => {
        if (presence.focusedId === id) {
          return <Selection key={connectionId} name={info.name} color={COLORS[connectionId % COLORS.length]} />
        }
      })}
    </>
  )
}

export default ViewGroupFormulation
