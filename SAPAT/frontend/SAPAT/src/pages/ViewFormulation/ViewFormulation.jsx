import { 
  RiShareLine, RiAddLine, RiCalculatorLine, RiDeleteBinLine, RiSave2Line, 
  RiPencilLine, RiLineChartLine, RiMore2Fill, RiSettings4Line, 
  RiArrowDownSLine, RiInformationLine, RiBarChartLine , RiMenuUnfoldLine, RiMenuFoldLine, RiArrowRightSLine, RiBookLine,
  RiHistoryLine
} from 'react-icons/ri';
import { useTranslation } from 'react-i18next'
import OptimizationResultsModal from '../../components/modals/OptimizationResultsModal.jsx';
import OptimizeFAB from '../../components/buttons/OptimizeFAB.jsx';
import { motion, AnimatePresence } from 'framer-motion'
import Info from '../../components/icons/Info.jsx'
import { useState, useEffect } from 'react'
import axios from 'axios'
import Loading from '../../components/Loading.jsx'
import ShareFormulationModal from '../../components/modals/formulations/ShareFormulationModal.jsx'
import ConfirmationModal from '../../components/modals/ConfirmationModal.jsx'
import Toast from '../../components/Toast.jsx'
import Avatar from '../../components/Avatar.jsx'
import Selection from '../../components/Selection.jsx'
import ChooseIngredientsModal from '../../components/modals/viewformulation/ChooseIngredientsModal.jsx'
import ChooseNutrientsModal from '../../components/modals/viewformulation/ChooseNutrientsModal.jsx'
import ChooseNutrientRatiosModal from '../../components/modals/viewformulation/ChooseNutrientRatiosModal.jsx'
import Warning from '../../components/icons/Warning.jsx'
import GenerateReport from '../../components/buttons/GenerateReport.jsx'
import UserCustomizationModal from '../../components/modals/formulations/UserCustomizationModal.jsx'
import handleGenerateReport from '../../components/handleGenerateReport.jsx'
import ShadowPricingTab from '../../components/modals/viewformulation/ShadowPricingTab.jsx'
import Progress from '../../components/modals/formulations/Progress.jsx'
import EditFormulationModal from '../../components/modals/formulations/EditFormulationModal.jsx';
import ManualFormulation from '../../components/modals/ManualFormulation.jsx';
import IngredientSubstituteModal from '../../components/modals/formulations/SubstituteModal.jsx';
import InfeasibilityModal from '../../components/modals/formulations/InfeasibilityModal.jsx';
import { set } from 'lodash';

const COLORS = ['#DC2626', '#D97706', '#059669', '#7C3AED', '#DB2777']

function ViewFormulation({
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
  specialformulations,
  updateShadowPrices,
  shadowPrices, 
  nutrientsMenu,
  updateNutrientsMenu,
  ingredientsMenu, 
  updateIngredientsMenu,
  nutrientRatioConstraints,
  updateNutrientRatioConstraints,
  percentFormulationRealTime,
  updatePercentWeight,
  updatePercentCode,
  updatePercentName,
  updatePercentDescription,
  updatePercentAnimalGroup,
  updatePercentCost,
  updatePercentIngredients,
  updatePercentNutrients,
  updatePercentIngredientProperty,
  updatePercentNutrientProperty,
  updatePercentShadowPrices,
  percentShadowPrices
}) {
  const VITE_API_URL = import.meta.env.VITE_API_URL
  const { t, i18n } = useTranslation();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  const [collaborators, setCollaborators] = useState([])
  const [newCollaborator, setNewCollaborator] = useState({})
  const [isShareFormulationModalOpen, setIsShareFormulationModalOpen] =
    useState(false)
  const [isAddCollaboratorModalOpen, setIsAddCollaboratorModalOpen] =
    useState(false)
  const [isLoading, setIsLoading] = useState(true)
  // toast visibility
  const [showToast, setShowToast] = useState(false)
  const [message, setMessage] = useState('')
  const [toastAction, setToastAction] = useState('')
  // all available ingredients and nutrients of the owner
  const [listOfIngredients, setListOfIngredients] = useState([])
  const [listOfNutrients, setListOfNutrients] = useState([])
  // choosing ingredients and nutrients to create feeds
  const [isChooseIngredientsModalOpen, setIsChooseIngredientsModalOpen] =
    useState(false)
  const [isChooseNutrientsModalOpen, setIsChooseNutrientsModalOpen] =
    useState(false)
  const [isChooseNutrientRatiosModalOpen, setIsChooseNutrientRatiosModalOpen] =
    useState(false)
  const [isToolbarOpen, setIsToolbarOpen] = useState(false);
  const [isPCCModalOpen, setIsPCCModalOpen] = useState(false)
  const [showAllDetails, setShowAllDetails] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [constraintMode, setConstraintMode] =useState('none')
  const [optimizationResults, setOptimizationResults] = useState(null);
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);
  const [isCustomizationModalOpen, setIsCustomizationModalOpen] = useState(false)

  const handleEditResult = (updatedFormulation, action, message) => {
    setIsEditModalOpen(false)
    setShowToast(true)
    setMessage(message)
    setToastAction(action)
  }

  const [isLargeOrSmaller, setIsLargeOrSmaller] = useState(false);
  useEffect(() => {
    const checkSize = () => setIsLargeOrSmaller(window.innerWidth <= 1024);
    checkSize();
    window.addEventListener('resize', checkSize);
    console.log("HERE IS THE FORMULATION", formulation)
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  const [activeTab, setActiveTab] = useState(null);

  const toggleTab = (tab) => {
    if (activeTab === tab) {
      setActiveTab(null);
    } else {
      setActiveTab(tab);
    }
  };

  const [selectedIngredients, setSelectedIngredients] = useState([])
  const [selectedNutrients, setSelectedNutrients] = useState([])
  const [shadowPricingTabOpen, setShadowPricingTabOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false)
  const [filterIngredientCode, setFilterIngredientCode] = useState('')
  const isDisabled = userAccess === 'view'
  const [showRoughageLimits, setShowRoughageLimits] = useState(true);
  const [showConcentrateLimits, setShowConcentrateLimits] = useState(true);
  const [showVitaminLimits, setShowVitaminLimits] = useState(true);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [substitutesLoading, setSubstitutesLoading] = useState(false);
  const [modalData, setModalData] = useState({
    name: '',
    details: null,
    substitutes: []
  });
  const [ispercentcompute, setispercentcompute] = useState(false)
  const [ispercentcomputeLast, setispercentcomputeLast] = useState(false)
  const [infeasibilityModal, setInfeasibilityModal] = useState({ isOpen: false, data: null });
  const [recentFormulation, setRecentFormulation] = useState('None Yet')

  const handleIngredientClick = async (ingredient) => {
    setIsSubModalOpen(true);
    setSubstitutesLoading(true);
    const targetId = ingredient.ingredient_id || ingredient._id;
    setModalData({ name: ingredient.name, details: null, substitutes: [] });
    try {
      const detailsRes = await fetch(`${import.meta.env.VITE_API_URL}/ingredient/${targetId}/${owner?.userId}`);
      const detailsData = await detailsRes.json();
      const nutrients = formulationRealTime?.nutrients || []
      const subRes = await fetch(`${import.meta.env.VITE_API_URL}/suggest-substitute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: owner?.userId, 
          targetIngredientId: targetId,
          nutrients
        })
      });
      const subData = await subRes.json();
      setModalData({
        name: ingredient.name,
        details: detailsData.ingredients,
        substitutes: subData.substitutes || []
      });
    } catch (error) {
      console.error("Error fetching ingredient data:", error);
    } finally {
      setSubstitutesLoading(false);
    }
  };

  const [showLimits, setShowLimits] = useState(false)
  
  useEffect(() => {
    if (formulation) {
      setSelectedIngredients(formulation.ingredients || [])
      setSelectedNutrients(formulation.nutrients || [])
    }
  }, [formulation])

  useEffect(() => {
    console.log("FORMULATION HERE", formulation)
  }, [])

  useEffect(() => {
    if (formulation) {
      showNutrientsMissingBasedonIngredientsPresent();
    }
  }, [formulation, selectedIngredients])

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        if (owner && formulation) {
          await Promise.all([fetchIngredients(), fetchNutrients()]);
        }
      } catch (error) {
        console.log(error)
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [formulation]);

  useEffect(() => {
    setIsLoading(true)
    fetchCollaboratorData()
    setIsLoading(false)
  }, [formulation.collaborators])

  useEffect(() => {
    isDirty && updateCost(0)
  }, [isDirty])

  useEffect(() => {
    const handleKeyPress = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault()
        handleSave(isDirty)
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => {
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [isDirty])

  const organizeIngredients = (fetchedData, phase) => {
    setListOfIngredients(fetchedData)
    const arr2Ids = new Set(
      phase === 'Custom' ?
        formulation.ingredients.map((item) => item.ingredient_id)
        : specialformulations.find((sf) => sf.name === phase)?.ingredients.map((item) => item.ingredient_id)
    )
    const unusedIngredients = fetchedData.filter(
      (item) => !arr2Ids.has(item.ingredient_id || item._id)
    )
    updateIngredientsMenu(unusedIngredients)
    const listOfIngredientsIds = new Set(
      fetchedData.map((item) => item.ingredient_id || item._id)
    )
    const nonExistingIngredients = formulation.ingredients.filter(
      (item) => !listOfIngredientsIds.has(item.ingredient_id)
    )
    const nonExistingIngredientsIds = new Set(nonExistingIngredients.map((item) => item.ingredient_id))
    updateIngredients(
      ingredients.filter(
        (item) => !nonExistingIngredientsIds.has(item.ingredient_id)
      )
    )
  }

  const organizeNutrients = (fetchedData, phase) => {
    const arr2Ids = new Set(
      phase === 'Custom' ?
        formulation.nutrients.map((item) => item.nutrient_id)
        : specialformulations.find((sf) => sf.name === phase)?.nutrients.map((item) => item.nutrient_id)
    )
    const unusedNutrients = fetchedData.filter(
      (item) => !arr2Ids.has(item.nutrient_id || item._id)
    )
    updateNutrientsMenu(unusedNutrients)
    const listOfNutrientsIds = new Set(
      fetchedData.map((item) => item.nutrient_id || item._id)
    )
    const nonExistingNutrients = formulation.nutrients.filter(
      (item) => !listOfNutrientsIds.has(item.nutrient_id)
    )
    const nonExistingNutrientsIds = new Set(nonExistingNutrients.map((item) => item.nutrient_id))
    updateNutrients(
      nutrients.filter(
        (item) => !nonExistingNutrientsIds.has(item.nutrient_id)
      )
    )
  }

  const fetchIngredients = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/ingredient/filtered/${owner?.userId}?limit=10000`
      )
      const fetchedData = res.data.ingredients
      organizeIngredients(fetchedData, 'Custom')
    } catch (err) {
      console.log(err)
    }
  }

  const fetchNutrients = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/nutrient/filtered/${owner?.userId}?limit=10000`
      )
      const fetchedData = res.data.nutrients
      setListOfNutrients(fetchedData)
      organizeNutrients(fetchedData, 'Custom')
    } catch (err) {
      console.log(err)
    }
  }

  const fetchCollaboratorData = async () => {
    try {
      if (!formulation.collaborators) return
      const collaboratorPromises = formulation.collaborators.map(
        async (collaborator) => {
          const res = await axios.get(
            `${VITE_API_URL}/user-check/id/${collaborator.userId}`
          )
          return {
            ...res.data.user,
            access: collaborator.access,
          }
        }
      )
      const collaboratorsData = await Promise.all(collaboratorPromises)
      setCollaborators(collaboratorsData)
    } catch (err) {
      console.log(err)
    }
  }

  const hideToast = () => {
    setShowToast(false)
    setMessage('')
    setToastAction('')
  }

  const handleOpenShareFormulationModal = () => {
    if (userAccess === 'owner') {
      setIsShareFormulationModalOpen(true)
    } else {
      setShowToast(true)
      setMessage(t('Only the owner can share the formulation.'))
      setToastAction('error')
    }
  }

  const goToConfirmationModal = (type, collaborator, message) => {
    if (type === 'error') {
      setShowToast(true)
      setMessage(message)
      setToastAction('error')
    } else if (type === 'linkCopied') {
      setShowToast(true)
      setMessage(message)
      setToastAction('success')
    } else {
      setNewCollaborator(collaborator)
      setIsAddCollaboratorModalOpen(true)
    }
  }

  const [detailedIngredients, setDetailedIngredients] = useState('')
  const [isManualFormulationOpen, setIsManualFormulationOpen] = useState(false)

  const handleManualOptimize = async () => {
    const nutrients = formulationRealTime?.nutrients || [];
    const ingredients = formulationRealTime?.ingredients || [];
    const dmIntake = formulationRealTime?.dmintake || 0;
    setIsLoading(true);
    try {
      const ids = ingredients.map((ing) => ing.ingredient_id || ing._id);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/ingredient/idarray`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const data = await response.json();
      if (data.message === "success") {
        const detailed = data.ingredients;
        setDetailedIngredients(detailed);
        const dmNutrientId = nutrients[nutrients.length - 1]?.nutrient_id || nutrients[nutrients.length - 1]?.id;
        const preparedData = ingredients.map((ing) => {
          const detail = detailed.find((d) => d._id === (ing.ingredient_id || ing._id));
          const dmValue = detail?.nutrients?.find((n) => n.nutrient === dmNutrientId)?.value || 0;
          const ratio = Number(ing.minimum || 0);
          const asFed = dmValue > 0 ? (ratio / dmValue) * 100 : 0;
          return { ...ing, detail, dmValue, asFed };
        });
        const totalAsFed = preparedData.reduce((sum, item) => sum + item.asFed, 0);
        const processedData = preparedData.map((item) => {
          const asFed100kg = totalAsFed > 0 ? (item.asFed / totalAsFed) * 100 : 0;
          const tmrDM = (asFed100kg * item.dmValue) / 100;
          return { ...item, asFed100kg, tmrDM };
        });
        const totalAsFed100kg = processedData.reduce((sum, item) => sum + item.asFed100kg, 0);
        const totalTMRDM = processedData.reduce((sum, item) => sum + item.tmrDM, 0);
        const calculatedTotalWeight = ((formulation.dmintake / 100) / totalTMRDM) * 100;
        let calculatedTotalCost = 0;
        const optimizedIngredients = processedData.map((item) => {
          const finalValueKg = totalAsFed100kg > 0 
            ? (item.asFed100kg / totalAsFed100kg) * calculatedTotalWeight 
            : 0;
          const ingredientPrice = Number(item.detail?.price || 0);
          calculatedTotalCost += ingredientPrice * finalValueKg;
          return {
            name: item.name,
            ingredient_id: item.ingredient_id || item._id,
            value: finalValueKg,
          };
        });
        const optimizedNutrients = nutrients.map((nut) => {
          const nutId = nut.nutrient_id || nut._id;
          const totalNutrientAchieved = processedData.reduce((sum, item, idx) => {
            const ingredientValueGrams = optimizedIngredients[idx].value;
            const nutEntry = item.detail?.nutrients?.find(n => n.nutrient === nutId);
            const nutValue = Number(nutEntry?.value || 0) / 100;
            const dryMatterKg = (ingredientValueGrams / 1000) * (item.dmValue / 100);
            return sum + (dryMatterKg * nutValue * 1000);
          }, 0);
          return {
            name: nut.name,
            value: totalNutrientAchieved
          };
        });
        setOptimizationResults({
          ingredients: optimizedIngredients,
          nutrients: optimizedNutrients,
          totalWeight: calculatedTotalWeight,
          totalCost: calculatedTotalCost, 
        });
      }
    } catch (error) {
      console.error("Error calculating manual formulation:", error);
    } finally {
      setIsLoading(false);
      setIsManualFormulationOpen(true);
    }
  };

  const handleOptimize = async (type) => {
    try {
      let weight = formulationRealTime?.weight || []
      let nutrients = formulationRealTime?.nutrients || []
      let ingredients = formulationRealTime?.ingredients || []  
      if (ispercentcompute){
        weight = percentFormulationRealTime?.weight || []
        nutrients = percentFormulationRealTime?.nutrients || []
        ingredients = percentFormulationRealTime?.ingredients || []
      }
      let ingredientsInGrams = ingredients.map(ing => ({
            ...ing,
            minimum: ing.minimum * 1000,
            maximum: ing.maximum * 1000,
          }));
      let weightinGrams = weight * 1000
      if (weight === 0){
        weightinGrams = ' '
      } 
      if (ispercentcompute){
        ingredientsInGrams = ingredients.map(ing => ({
            ...ing,
            minimum: ing.minimum,
            maximum: ing.maximum,
          }));
      }
      const res = await axios.post(`${VITE_API_URL}/optimize/simplex`, {
        userId: owner?.userId,
        ingredients: ingredientsInGrams,
        nutrients,
        weight: weightinGrams,
        nutrientRatioConstraints,
        type: ispercentcompute ? 'percent' : 'absolute'
      })
      const optimizedCost = res.data.optimizedCost
      const optimizedIngredients = res.data.optimizedIngredients
      const optimizedNutrients = res.data.optimizedNutrients
      const shadowPricesResult = res.data.shadowPrices
      const amountFed = parseFloat(res.data.weight/1000).toFixed(2)
      const rawTotalWeight = res.data.weight || 0;
      if (ispercentcompute){
        updatePercentShadowPrices(shadowPricesResult || []);
        updatePercentCost(optimizedCost);
        optimizedIngredients.forEach((ing) => {
          const originalIng = ingredients.find(i => i.name === ing.name);
          if (originalIng) {
              let percentValue = 0;
              if (rawTotalWeight > 0) {
                percentValue = (ing.value / rawTotalWeight) * 100;
              }
              updatePercentIngredientProperty(originalIng.ingredient_id, 'value', Number(ing.value.toFixed(2)));
          }
        });
        optimizedNutrients.forEach((nut) => {
          const nutrientId = nutrients.find(n => n.name === nut.name)?.nutrient_id;
          if (nutrientId){
            updatePercentNutrientProperty(nutrientId, 'value', Number(nut.value))
          }
        })
        updatePercentWeight(amountFed)
      } else {
        updateShadowPrices(shadowPricesResult || []);
        updateCost(optimizedCost/1000)
        optimizedIngredients.forEach((ing) => {
            const originalIng = ingredients.find(i => i.name === ing.name);
            if (originalIng) {
                updateIngredientProperty(originalIng.ingredient_id, 'value', Number(ing.value)/1000);
            }
        });
        optimizedNutrients.forEach((nut) => {
          const nutrientId = nutrients.find(n => n.name === nut.name)?.nutrient_id;
          if (nutrientId){
            updateNutrientProperty(nutrientId, 'value', Number(nut.value))
          }
        })
        updateWeight(amountFed)
      }
      setOptimizationResults({
        ingredients: optimizedIngredients,
        nutrients: optimizedNutrients,
        totalWeight: amountFed,
        totalCost: optimizedCost / 1000,
      });
      console.log("Optimization results:", res.data);
      setIsResultsModalOpen(true);
      setIsDirty(false)
      setMessage(t('Formulation Creator'))
      setispercentcomputeLast(ispercentcompute)
      setRecentFormulation('Success')
    } catch (err) {
      setRecentFormulation('Fail')
      if (err.response?.data?.status === 'No optimal solution') {
        setShowToast(true)
        setMessage(t('No feasible formula found. Please adjust your constraints.'))
        setToastAction('error')
        ingredients.map((ing, index) => {
          const ingredientId = ingredients.find(i => i.name === ing.name)?.ingredient_id;
          updateIngredientProperty(ingredientId, 'value', 0)
        })
        nutrients.map((ing, index) => {
          const nutrientId = nutrients.find(n => n.name === ing.name)?.nutrient_id;
          updateNutrientProperty(nutrientId, 'value', 0)
        })
        const d = err.response.data;
        setInfeasibilityModal({
          isOpen: true,
          data: {
            priorityAdvice: d.priorityAdvice,
            suggestion: d.suggestion,
            structuralIssues: d.structuralIssues || [],
            nutrientIssues: d.nutrientIssues || [],
            smartIngredientSuggestions: d.smartIngredientSuggestions || [],
            ispercent: ispercentcomputeLast
          }
        });
      }
    }
  }

  const handleAddCollaborator = async () => {
    try {
      await axios.put(
        `${VITE_API_URL}/formulation/collaborator/${id}`,
        {
          updaterId: user?._id,
          collaboratorId: newCollaborator.newId,
          access: newCollaborator.newAccess,
          displayName: newCollaborator.newDisplayName,
        }
      )
      const newCollaboratorData = {
        _id: newCollaborator.newId,
        email: newCollaborator.newEmail,
        access: newCollaborator.newAccess,
        profilePicture: newCollaborator.newProfilePicture,
        displayName: newCollaborator.newDisplayName,
      }
      setCollaborators([...collaborators, newCollaboratorData])
      setShowToast(true)
      setMessage(t('Collaborator added successfully'))
      setToastAction('success')
    } catch (err) {
      console.log(err)
    }
  }

  const handleUpdateCollaborator = (updatedCollaborators) => {
    setCollaborators(updatedCollaborators)
    setShowToast(true)
    setMessage(t('Collaborator updated successfully'))
    setToastAction('success')
  }

  const handleDeleteCollaborator = async (collaboratorId) => {
    try {
      await axios.delete(
        `${VITE_API_URL}/formulation/collaborator/${id}/${collaboratorId}`
      )
      setCollaborators(
        collaborators.filter(
          (collaborator) => collaborator._id !== collaboratorId
        )
      )
      setShowToast(true)
      setMessage(t('Collaborator deleted successfully'))
      setToastAction('success')
    } catch (err) {
      console.log(err)
    }
  }

  const handleAddIngredients = async (ingredientsToAdd) => {
    try {
      const ingredientsWithGroup = ingredientsToAdd.map((ingredient) => {
        const matched = ingredientsMenu.find(
          (item) =>
            item._id === ingredient.ingredient_id ||
            item.ingredient_id === ingredient.ingredient_id
        );
        return {
          ...ingredient,
          group: matched?.group || "",
        };
      });
      const res = await axios.put(
        `${VITE_API_URL}/formulation/ingredients/${id}`,
        { ingredients: ingredientsWithGroup }
      );
      const newIngredients = res.data.addedIngredients
      const formattedIngredients = newIngredients.map((ingredient) => {
        const menuIngredient = ingredientsMenu.find(
          (item) => item.ingredient_id === ingredient.ingredient_id || item._id === ingredient.ingredient_id
        );
        return {
          ...ingredient,
          minimum: 0,
          maximum: 0,
          value: 0,
          group: menuIngredient?.group || ''
        }
      })
      setSelectedIngredients([...selectedIngredients, ...formattedIngredients])
      const arr2Ids = new Set(
        formattedIngredients.map((item) => item.ingredient_id)
      )
      updateIngredientsMenu(ingredientsMenu.filter((item) => !arr2Ids.has(item.ingredient_id || item._id)))
      updateCost(0)
      updateIngredients([...selectedIngredients, ...formattedIngredients])
      updatePercentIngredients([...selectedIngredients, ...formattedIngredients])
      setIsChooseIngredientsModalOpen(false)
      setIsDirty(false)
      setShowToast(true)
      setMessage(t('Ingredients added successfully'))
      setToastAction('success')
    } catch (err) {
      console.log(err)
      setShowToast(true)
      setMessage(t('Error adding ingredients'))
      setToastAction('error')
    }
  }

  const handleAddNutrients = async (nutrientsToAdd) => {
    try {
      const res = await axios.put(
        `${VITE_API_URL}/formulation/nutrients/${id}`,
        { nutrients: nutrientsToAdd }
      )
      const newNutrients = res.data.addedNutrients
      const formattedNutrients = newNutrients.map((nutrient) => {
        return {
          ...nutrient,
          minimum: 0,
          maximum: 0,
          value: 0,
        }
      })
      setSelectedNutrients([...selectedNutrients, ...formattedNutrients])
      const arr2Ids = new Set(
        formattedNutrients.map((item) => item.nutrient_id)
      )
      updateNutrientsMenu(nutrientsMenu.filter((item) => !arr2Ids.has(item.nutrient_id || item._id)))
      updateCost(0)
      updateNutrients([...selectedNutrients, ...formattedNutrients])
      setIsChooseNutrientsModalOpen(false)
      setIsDirty(false)
      setShowToast(true)
      setMessage(t('Nutrients added successfully'))
      setToastAction('success')
    } catch (err) {
      console.log(err)
      setShowToast(true)
      setMessage(t('Error adding nutrients'))
      setToastAction('error')
    }
  }

  const handleRemoveIngredient = async (ingredientToRemove) => {
    try {
      await axios.delete(
        `${VITE_API_URL}/formulation/ingredients/${id}/${ingredientToRemove.ingredient_id}`
      )
      setSelectedIngredients(
        selectedIngredients.filter(
          (item) => item.ingredient_id !== ingredientToRemove.ingredient_id
        )
      )
      updateIngredients(
        ingredients.filter(
          (item) => item.ingredient_id !== ingredientToRemove.ingredient_id
        )
      )
      updatePercentIngredients(
        percentingredients.filter(
          (item) => item.ingredient_id !== ingredientToRemove.ingredient_id
        )
      )
      const removedIngredient = listOfIngredients.find((item) =>
        item.ingredient_id
          ? item.ingredient_id === ingredientToRemove.ingredient_id
          : item._id === ingredientToRemove.ingredient_id
      )
      if (removedIngredient) {
        updateIngredientsMenu([removedIngredient, ...ingredientsMenu])
      }
      updateCost(0)
      setIsDirty(false)
      setShowToast(true)
      setMessage(t('Ingredient removed successfully'))
      setToastAction('success')
    } catch (err) {
      console.log(err)
      setShowToast(true)
      setMessage(t('Error removing ingredient'))
      setToastAction('error')
    }
  }

  const handleRemoveNutrient = async (nutrientToRemove) => {
    try {
      await axios.delete(
        `${VITE_API_URL}/formulation/nutrients/${id}/${nutrientToRemove.nutrient_id}`
      )
      setSelectedNutrients(
        selectedNutrients.filter(
          (item) => item.nutrient_id !== nutrientToRemove.nutrient_id
        )
      )
      updateNutrients(
        nutrients.filter(
          (item) => item.nutrient_id !== nutrientToRemove.nutrient_id
        )
      )
      const removedNutrient = listOfNutrients.find((item) =>
        item.nutrient_id
          ? item.nutrient_id === nutrientToRemove.nutrient_id
          : item._id === nutrientToRemove.nutrient_id
      )
      if (removedNutrient) {
        updateNutrientsMenu([removedNutrient, ...nutrientsMenu])
      }
      const filteredConstraints = (nutrientRatioConstraints || []).filter(
        (constraint) =>
          constraint.firstIngredientId !== nutrientToRemove.nutrient_id &&
          constraint.secondIngredientId !== nutrientToRemove.nutrient_id
      )
      if (filteredConstraints.length !== (nutrientRatioConstraints || []).length) {
        updateNutrientRatioConstraints(filteredConstraints)
      }
      updateCost(0)
      setIsDirty(false)
      setShowToast(true)
      setMessage(t('Nutrient removed successfully'))
      setToastAction('success')
    } catch (err) {
      console.log(err)
      setShowToast(true)
      setMessage(t('Error removing nutrient'))
      setToastAction('error')
    }
  }

  const handleIngredientMinimumChange = (index, value) => {
    if (ispercentcompute === false){
      value === 'N/A' || value === ''
        ? updateIngredientProperty(index, 'minimum', 0)
        : updateIngredientProperty(index, 'minimum', value)
    } else{
      value === 'N/A' || value === ''
        ? updatePercentIngredientProperty(index, 'minimum', 0)
        : updatePercentIngredientProperty(index, 'minimum', value)
    }
  }

  const handleIngredientMaximumChange = (index, value) => {
    if (ispercentcompute === false){
      value === 'N/A' || value === ''
        ? updateIngredientProperty(index, 'maximum', 0)
        : updateIngredientProperty(index, 'maximum', value)
    } else{
      value === 'N/A' || value === ''
        ? updatePercentIngredientProperty(index, 'maximum', 0)
        : updatePercentIngredientProperty(index, 'maximum', value)
    }
  }

  const handleNutrientMinimumChange = (index, value) => {
    
      value === 'N/A' || value === ''
      ? updateNutrientProperty(index, 'minimum', 0)
      : updateNutrientProperty(index, 'minimum', value)

      value === 'N/A' || value === ''
      ? updatePercentNutrientProperty(index, 'minimum', 0)
      : updatePercentNutrientProperty(index, 'minimum', value)
 
  }

  const handleNutrientMaximumChange = (index, value) => {

      value === 'N/A' || value === ''
      ? updateNutrientProperty(index, 'maximum', 0)
      : updateNutrientProperty(index, 'maximum', value)

      value === 'N/A' || value === ''
        ? updatePercentNutrientProperty(index, 'maximum', 0)
        : updatePercentNutrientProperty(index, 'maximum', value)

  }

  const renderIngredientsTableRows = (group) => {
    const activeFormulation = ispercentcompute ? percentFormulationRealTime : formulationRealTime;
    const currentIngredients = activeFormulation?.ingredients || [];
    const groupFilter1 = ["grass", "legumes"]
    const groupFilter2 = ["agricultural by-products", "industrial by-products"]
    const groupFilter3 = ["vitamin-mineral"]
    const filtered = currentIngredients.filter(
      (ingredient) => {
        if (group === 'roughage') {
          return groupFilter1.some((g) => ingredient.group?.toLowerCase().includes(g.toLowerCase()))
        } else if (group === 'concentrate') {
          return groupFilter2.some((g) => ingredient.group?.toLowerCase().includes(g.toLowerCase()))
        } else if (group === 'vitamins') {
          return groupFilter3.some((g) => ingredient.group?.toLowerCase().includes(g.toLowerCase()))
        } else {
          return ingredient
        }
      }
    )
    const isLimitVisible = 
      group === 'roughage' ? showRoughageLimits : 
      group === 'concentrate' ? showConcentrateLimits : 
      group === 'vitamins' ? showVitaminLimits :
      showVitaminLimits;

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
                    const inputValue = e.target.value;
                    if (
                      /^N\/A(\d+|\.)/.test(inputValue) ||
                      /^\d*\.?\d{0,2}$/.test(inputValue)
                    ) {
                      let processedValue = /^N\/A\d*/.test(inputValue)
                        ? inputValue.replace('N/A', '')
                        : inputValue;
                      if (ispercentcompute && processedValue !== '' && Number(processedValue) > 100) {
                        processedValue = '100';
                      }
                      handleIngredientMinimumChange(ingredient.ingredient_id, processedValue);
                      setIsDirty(false);
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
                    const inputValue = e.target.value;
                    if (
                      /^N\/A(\d+|\.)/.test(inputValue) ||
                      /^\d*\.?\d{0,2}$/.test(inputValue)
                    ) {
                      let processedValue = /^N\/A\d*/.test(inputValue)
                        ? inputValue.replace('N/A', '')
                        : inputValue;
                      if (ispercentcompute && processedValue !== '' && Number(processedValue) > 100) {
                        processedValue = '100';
                      }
                      handleIngredientMaximumChange(ingredient.ingredient_id, processedValue);
                      setIsDirty(false);
                    }
                  }}
                />
              </td>
            </>
          )}
          <td className="font-semibold text-gray-800">
            {ingredient 
              ? `${(ingredient.value || 0).toFixed(3)} ${ispercentcompute ? '%' : 'kg'}` 
              : `0.000 ${ispercentcompute ? '%' : 'kg'}`}
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
                if (
                  /^N\/A(\d+|\.)/.test(inputValue) ||
                  /^\d*\.?\d{0,2}$/.test(inputValue)
                ) {
                  const processedValue = /^N\/A\d*/.test(inputValue)
                    ? inputValue.replace('N/A', '')
                    : inputValue
                  handleNutrientMinimumChange(nutrient.nutrient_id, processedValue)
                  setIsDirty(false)
                }
              }}
              onFocus={() =>
                updateMyPresence({ focusedId: `nutrient-${index}-minimum` })
              }
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
                if (
                  /^N\/A(\d+|\.)/.test(inputValue) ||
                  /^\d*\.?\d{0,2}$/.test(inputValue)
                ) {
                  const processedValue = /^N\/A\d*/.test(inputValue)
                    ? inputValue.replace('N/A', '')
                    : inputValue
                  handleNutrientMaximumChange(nutrient.nutrient_id, processedValue)
                  setIsDirty(false)
                }
              }}
              onFocus={() =>
                updateMyPresence({ focusedId: `nutrient-${index}-maximum` })
              }
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
              <button className='btn btn-ghost btn-xs text-deepbrown hover:bg-deepbrown/10 items-center gap-1'
                disabled={isDisabled}
                onClick={() => handleEditNutrientRatio(index)}
              >
                <RiPencilLine className='h-4 w-4 text-deepbrown'/>
              </button>
              <button
                disabled={isDisabled}
                className={`${isDisabled ? 'hidden' : ''} btn btn-ghost btn-xs text-red-500 hover:bg-red-200 ml-1`}
                onClick={() => handleDeleteNutrientRatio(index)}
              >
                <RiDeleteBinLine />
              </button>
            </div>
          </td>
        </tr>
      ))
    }
  }

  const [phase, setPhase] = useState('Custom');
  const ChangeFormulationByPhase = (phase) => {
    setPhase(phase);
    if (phase === 'Custom') {
      updateWeight(formulation.weight);
      updateCost(formulation.cost);
      organizeIngredients(listOfIngredients, phase)
      organizeNutrients(listOfNutrients, phase)
      updateIngredients(formulation.ingredients || []);
      updateNutrients(formulation.nutrients || []);
    } else {
      const selectedPhase = specialformulations.find(sf => sf.name === phase);
      if (selectedPhase) {
        updateWeight(selectedPhase.weight);
        updateCost(selectedPhase.cost);
        organizeIngredients(listOfIngredients, phase)
        organizeNutrients(listOfNutrients, phase)
        updateIngredients(selectedPhase.ingredients || []);
        updateNutrients(selectedPhase.nutrients || []);
      }
    }
  }

  // eslint-disable-next-line no-unused-vars
  const dummyNutrientRatioConstraintSamples = {
    id: 1,
    name: "Starter Feed",
    ingredients: [
      { name: "Corn", percentage: 50 },
      { name: "Soybean Meal", percentage: 30 },
      { name: "Fish Meal", percentage: 10 },
      { name: "Premix", percentage: 10 }
    ],
    nutrientConstraints: {
      protein: { min: 20, max: 24 },
      fat: { min: 3, max: 5 },
      fiber: { min: 2, max: 5 },
      calcium: { min: 0.8, max: 1.2 },
      phosphorus: { min: 0.4, max: 0.6 }
    },
    nutrientRatioConstraints: [
      {
        firstIngredient: "Protein",
        secondIngredient: "Fat",
        operator: "=", 
        firstIngredientRatio: 2,
        secondIngredientRatio: 1
      },
      {
        firstIngredient: "Calcium",
        secondIngredient: "Phosphorus",
        operator: ">=", 
        firstIngredientRatio: 3,
        secondIngredientRatio: 2
      },
    ]
  };

  const [nutrientRatioModifyType, setNutrientRatioModifyType] = useState('add');
  const [editingNutrientRatioIndex, setEditingNutrientRatioIndex] = useState(null);
  const [nutrientRatioToEdit, setNutrientRatioToEdit] = useState(null);
  const [missingNutrientsValue, setMissingNutrientsValue] = useState([]);
  const [advancedPressed, setAdvancedPressed] = useState(formulation.animal_group==="Calf (0-4 months) - lower than 100kg | Bulo (0 - 4 na buwan)"? true: false);
  const [progressPressed, setProgressPressed] = useState(false);

  const handleEditNutrientRatio = (index) => {
    setEditingNutrientRatioIndex(index);
    setNutrientRatioToEdit(nutrientRatioConstraints[index]);
    setNutrientRatioModifyType('Edit');
    setIsChooseNutrientRatiosModalOpen(true);
  };

  const handleUpdateNutrientRatio = (updatedRatio) => {
    const updatedConstraints = [...nutrientRatioConstraints];
    updatedConstraints[editingNutrientRatioIndex] = updatedRatio;
    updateNutrientRatioConstraints(updatedConstraints);
    setEditingNutrientRatioIndex(null);
    setNutrientRatioToEdit(null);
  };

  const handleDeleteNutrientRatio = (index) => {
    const updatedConstraints = nutrientRatioConstraints.filter((_, i) => i !== index);
    updateNutrientRatioConstraints(updatedConstraints);
  };

  if (isLoading || formulation.length === 0 || !owner) {
    return <Loading />
  }

  if (!formulationRealTime) {
    return <Loading />
  }

  function showNutrientsMissingBasedonIngredientsPresent() {
    if (selectedIngredients.length === 0) {
      setMissingNutrientsValue((formulation.nutrients || []).map(n => n.name));
      return;
    }
    const ingredientIds = selectedIngredients.map(ing => ing.ingredient_id || ing._id);
    axios.post(`${import.meta.env.VITE_API_URL}/ingredient/idarray`, {
      ids: ingredientIds
    })
      .then(res => res.data.ingredients)
      .then(ingredientswithnutri => {
        if (!ingredientswithnutri || ingredientswithnutri.length === 0) {
          setMissingNutrientsValue((formulation.nutrients || []).map(n => n.name));
          return;
        }
        const allNutrientInFormulationId = (formulation.nutrients || []).reduce((acc, nutrient) => {
          acc[nutrient.nutrient_id] = 0;
          return acc;
        }, {});
        (formulation.nutrients || []).forEach(formulationnutrient => {
          ingredientswithnutri.forEach(ingredient => {
            (ingredient.nutrients || []).forEach(nutrient => {
              if (nutrient.nutrient === formulationnutrient.nutrient_id) {
                allNutrientInFormulationId[nutrient.nutrient] += (nutrient.value || 0);
              }
            });
          });
        });
        const missingNutrients = Object.entries(allNutrientInFormulationId)
          .filter(([_, value]) => value === 0)
          .map(([nutrientId]) => {
            const nutrientObj = (formulation.nutrients || []).find(
              n => n.nutrient_id === nutrientId
            );
            return nutrientObj ? nutrientObj.name : `Nutrient ID: ${nutrientId}`;
          });
        setMissingNutrientsValue(missingNutrients);
      })
      .catch(err => {
        console.error("Error fetching ingredients by IDs:", err);
      });
  }

  const resetFormulationToInitialState = () => {
    nutrients.map((nutrient, index) => {
      handleNutrientMinimumChange(nutrient.nutrient_id, formulation.origNutrientTargets[index].minimum)
      handleNutrientMaximumChange(nutrient.nutrient_id, formulation.origNutrientTargets[index].maximum)
    })
  }

  const percentFormulationToInitialStateIngredients = () => {
    ingredients.map((ingredient, index) => {
      handleIngredientMinimumChange(ingredient.ingredient_id, (ingredient.value/weight * 100).toFixed(1))
      handleIngredientMaximumChange(ingredient.ingredient_id, 0)
    })
  }

  const resetFormulationToInitialStateIngredients = () => {
    ingredients.map((ingredient, index) => {
      handleIngredientMinimumChange(ingredient.ingredient_id, 0)
      handleIngredientMaximumChange(ingredient.ingredient_id, 0)
    })
  }

  const {
    weight,
    code,
    name,
    description,
    animal_group,
    cost
  } = formulationRealTime

  const nutrients = formulationRealTime?.nutrients || []
  const ingredients = formulationRealTime?.ingredients || []  

  const {
    weight: percentweight,
    code: percentcode,
    name: percentname,
    description: percentdescription,
    animal_group: percentanimal_group,
    cost: percentcost
  } = percentFormulationRealTime

  const percentnutrients = percentFormulationRealTime?.nutrients || []
  const percentingredients = percentFormulationRealTime?.ingredients || []  
  
  return (
    <div className="flex h-full flex-col bg-gray-50 md:flex-row">
  
      {/* Main Content */}
      <div className="flex-1 p-4">
        <div className="space-y-2">
          {/* Header */}
          <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
        <h1 className="text-deepbrown text-xl font-bold md:text-2xl">
          {t('Feed Formulation (Single)')}
        </h1>
        <div className="flex flex-row items-center space-x-2 md:space-x-4 mb-4 overflow-x-auto no-scrollbar">
              {/* STEP 1 */}
              <div className="flex items-center gap-2 shrink-0">
                <h1 className="text-gray-300 text-xs font-bold md:text-sm uppercase tracking-wider">
                  {t('Select/Create')}
                </h1>
                <RiArrowRightSLine className="text-gray-300 h-5 w-5" />
              </div>
      
              {/* STEP 2 - ACTIVE */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex flex-col items-center">
                  <h1 className="text-deepbrown text-xs font-bold md:text-sm uppercase tracking-wider">
                    {t('Formulate')}
                  </h1>
                  <div className="h-1 w-full bg-deepbrown rounded-full mt-0.5 animate-pulse" />
                </div>
                <RiArrowRightSLine className="text-gray-300 h-5 w-5" />
              </div>
      
              {/* STEP 3 */}
              <div className="flex items-center gap-2 shrink-0">
                <h1 className="text-gray-300 text-xs font-bold md:text-sm uppercase tracking-wider">
                  {t('Generate')}
                </h1>
              </div>
            </div>
      
      {/* 2. TOGGLE BUTTONS ROW (Visible on Large and Smaller) */}
      {isLargeOrSmaller && (
        <div className="flex items-center gap-2">
          {/* Tools Toggle */}
          <button 
            onClick={() => toggleTab('tools')}
            className={`btn btn-sm border rounded-xl gap-2 transition-all ${
              activeTab === 'tools' 
                ? 'bg-deepbrown text-white border-deepbrown' 
                : 'bg-white text-deepbrown border-gray-200'
            }`}
          >
            <RiSettings4Line className={activeTab === 'tools' ? 'rotate-90' : ''} />
            <span className="text-xs">{t('Compute')}</span>
            <RiArrowDownSLine className={activeTab === 'tools' ? 'rotate-180' : ''} />
          </button>
          {/* Details Toggle */}
          <button 
            onClick={() => toggleTab('details')}
            className={`btn btn-sm border rounded-xl gap-2 transition-all ${
              activeTab === 'details' 
                ? 'bg-deepbrown text-white border-deepbrown' 
                : 'bg-white text-deepbrown border-gray-200'
            }`}
          >
            <RiInformationLine className={activeTab === 'details' ? 'text-white' : 'text-green-button'} />
            <span className="text-xs">{t('Details')}</span>
            <RiArrowDownSLine className={activeTab === 'details' ? 'rotate-180' : ''} />
          </button>
        </div>
      )}
    </div>

    {/* --- COLLAPSIBLE CONTENT AREA --- */}
    <div className="relative">
      
      {/* 3. TOOLS / COMPUTE PANEL */}
      <AnimatePresence>
        {(activeTab === 'tools' || !isLargeOrSmaller) && (
          <motion.div
          initial={isLargeOrSmaller ? { height: 0, opacity: 0 } : false}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="relative z-[30]" 
          style={{ overflow: 'visible' }}
        >
          {/* --- COMPUTE / TOOLS TOOLBAR --- */}
<div className="relative z-20 flex flex-col gap-3 sm:flex-row-reverse sm:items-center sm:justify-between bg-white p-3 rounded-2xl border border-gray-100 shadow-sm md:mb-2">
  {/* SECTION A: Share & Save */}
  <div className="flex items-center justify-between sm:justify-end gap-3 pb-2 sm:pb-0 border-b border-gray-50 sm:border-none">
    {/* Avatars */}
    <div className="flex space-x-2 shrink-0">
      {others.map(({ connectionId, info }) => (
        <Avatar key={connectionId} src={info?.avatar} name={info?.name} />
      ))}
      <Avatar src={self.info.avatar} name={t('You')} />
    </div>
    {/* Primary Actions */}
    <div className="flex items-center gap-2">
      <button 
        onClick={handleOpenShareFormulationModal} 
        className="btn btn-ghost btn-sm border border-gray-300 gap-2 rounded-xl text-xs font-medium"
      >
        <RiShareLine /> <span className="hidden xs:inline">{t('Share')}</span>
      </button>
      <button 
        onClick={() => handleSave(isDirty)} 
        className="btn bg-green-button border-none btn-sm gap-2 rounded-xl text-xs text-white hover:bg-green-600 shadow-sm transition-all active:scale-95"
      >
        <RiSave2Line className="h-4 w-4" /> <span>{t('Save')}</span>
      </button>
    </div>
  </div>
  {/* SECTION B: Core Tools */}
  <div className="flex flex-wrap items-center gap-2 pt-1 sm:pt-0">
          
          {/* Optimize Dropdown */}
          {constraintMode !== 'percent' &&(
            <div className="dropdown dropdown-bottom dropdown-start">
            <div tabIndex={0} role="button" className="btn bg-green-button border-none text-white btn-sm gap-2 rounded-xl shadow-sm">
              <RiCalculatorLine /> <span className="inline">{t('Optimize')}</span>
            </div>
            <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-[100] w-52 p-2 shadow-xl border border-base-200 mt-2">
              <li><button className="py-2.5 text-xs" onClick={() => handleOptimize('simplex-dry-matter')}>{t('Simplex Hard Constraint')}</button></li>
            </ul>
          </div>
          )}
          
            <GenerateReport className='z-[9999]'
                  userAccess={userAccess}
                  formulation={formulationRealTime}
                  owner={owner}
                  weight={weight}
                  shadowPrices={shadowPrices}
                  isCustomizationModalOpen={isCustomizationModalOpen}
                  setIsCustomizationModalOpen={setIsCustomizationModalOpen}
            />
          {recentFormulation === 'Success' && (
            <div className="hidden lg:flex items-center gap-2">
              <button 
                className="btn border-green-200 bg-green-50 hover:bg-green-100 btn-sm gap-2 rounded-xl text-xs px-3 font-bold text-green-700 transition-all" 
                onClick={() => setIsResultsModalOpen(true)}
              >
                <RiHistoryLine className="animate-pulse" /> {t('Latest Results')}
              </button>
            </div>
          )}
          {recentFormulation === 'Fail' && (
            <div className="hidden lg:flex items-center gap-2">
              <button 
                className="btn border-red-200 bg-red-50 hover:bg-red-100 btn-sm gap-2 rounded-xl text-xs px-3 font-bold text-red-700 transition-all" 
                onClick={() => setInfeasibilityModal(prev => ({ ...prev, isOpen: true }))}
              >
                <RiHistoryLine className="animate-pulse" /> {t('Latest Results')}
              </button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="dropdown dropdown-bottom dropdown-end lg:hidden">
              <div tabIndex={0} role="button" className="btn btn-ghost btn-sm border border-gray-300 rounded-xl px-2">
                <RiMore2Fill size={20} className="text-deepbrown" />
              </div>
              <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-[100] w-48 p-2 shadow-xl border border-base-200 mt-2">
                {/* <li><button className="text-xs" onClick={() => setShadowPricingTabOpen(true)}><RiLineChartLine /> {t('Shadow Prices')}</button></li> */}
                {formulation.animal_group !=="Calf (0-4 months) - lower than 100kg | Bulo (0 - 4 na buwan)" && (
                  <li><button className="text-xs" onClick={() => setAdvancedPressed(!advancedPressed)}><RiSettings4Line /> {advancedPressed ? t('Show Basic') : t('Show Advanced')}</button></li>
                )}
                <li><button className="text-xs" onClick={() => setProgressPressed(!progressPressed)}><RiBarChartLine /> {t('Show Progress')}</button></li>
                {optimizationResults && (
                  <li>
                    <button className="text-xs" onClick={() => setIsResultsModalOpen(true)}>
                      <RiHistoryLine /> {t('Latest Results')}
                    </button>
                  </li>
                )}
              </ul>
            </div>
            <div className="hidden lg:flex items-center gap-2">
              <button className="btn border border-gray-300 bg-white btn-sm gap-2 rounded-xl text-xs px-3 font-medium" onClick={() => setShadowPricingTabOpen(true)}>
                <RiLineChartLine /> {t('Shadow Prices')}
              </button>
            </div>
            <div className="hidden lg:flex items-center gap-2">
              {formulation.animal_group !=="Calf (0-4 months) - lower than 100kg | Bulo (0 - 4 na buwan)" ? (
              <button className="btn border border-gray-300 bg-white btn-sm gap-2 rounded-xl text-xs px-3 font-medium" onClick={() => setAdvancedPressed(!advancedPressed)}>
                <RiSettings4Line /> {advancedPressed ? t('Show Basic') : t('Show Advanced')}
              </button>
              ): 
              <button className="btn border border-gray-300 bg-white btn-sm gap-2 rounded-xl text-xs px-3 font-medium" disabled>
                <RiSettings4Line /> {t('Manual Modify')}
              </button>
              }
            </div>
            <div className="hidden lg:flex items-center gap-2">
              <button 
                className="btn border border-gray-300 bg-white btn-sm gap-2 rounded-xl text-xs px-3 hover:bg-gray-50 text-deepbrown font-medium" 
                onClick={() => setProgressPressed(!progressPressed)}
              >
                <RiBarChartLine /> {t('Progress')}
            </button>
            </div>
          </div>
        </div>
</div>
        </motion.div>
        )}
      </AnimatePresence>

      {/* Slim Constraint Type Selector */}
<div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 md:px-5 md:py-3 bg-white rounded-xl border border-gray-100 shadow-sm mt-4 mb-4">
  {/* Header Section */}
  <div>
    <h3 className="text-xs font-bold text-deepbrown uppercase tracking-wider">
      {t('Constraint Setup')}
    </h3>
  </div>
  {/* Radio Buttons Container */}
  <div className="flex flex-row items-center gap-2 sm:gap-3">
    
    {/* Option 1: Percent-Based */}
    <label 
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-all flex-1 md:flex-none ${
        ispercentcompute 
          ? 'border-deepbrown bg-gray-50 ring-1 ring-deepbrown/20' 
          : 'border-gray-100 hover:border-gray-300'
      }`}
    >
      <input
        type="radio"
        name="constraintType"
        checked={ispercentcompute === true}
        onChange={() => setispercentcompute(true)}
        className="w-4 h-4 appearance-none border border-gray-300 rounded-full checked:border-deepbrown checked:border-[5px] transition-all"
      />
      <span className="text-sm font-semibold text-deepbrown whitespace-nowrap">
        {t('Percent-Based')}
      </span>
    </label>
    {/* Option 2: Kg-Based */}
    <label 
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-all flex-1 md:flex-none ${
        !ispercentcompute 
          ? 'border-deepbrown bg-gray-50 ring-1 ring-deepbrown/20' 
          : 'border-gray-100 hover:border-gray-300'
      }`}
    >
      <input
        type="radio"
        name="constraintType"
        checked={ispercentcompute === false}
        onChange={() => setispercentcompute(false)}
        className="w-4 h-4 appearance-none border border-gray-300 rounded-full checked:border-deepbrown checked:border-[5px] transition-all"
      />
      <span className="text-sm font-semibold text-deepbrown whitespace-nowrap">
        {t('Kg-Based')}
      </span>
    </label>
  </div>
</div>

      {/* 4. DETAILS / CARABAO INFO PANEL */}
      <AnimatePresence>
  {(activeTab === 'details' || (!isLargeOrSmaller && window.innerWidth >= 768)) && (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="overflow-hidden bg-white rounded-2xl border border-gray-100 shadow-sm"
    >
      {/* Header Section */}
      <div className="px-4 md:px-6 pt-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-bold text-deepbrown uppercase tracking-wider">{t('Formulation Summary')}</h3>
          {/* Toggle Button for Laptop */}
          <button 
            onClick={() => setShowAllDetails(!showAllDetails)}
            className="hidden md:flex btn btn-ghost btn-xs text-deepbrown/50 hover:bg-gray-100 gap-1 normal-case"
          >
            {showAllDetails ? t('Show less') : t('View more details')}
            <svg 
              className={`transition-transform duration-200 ${showAllDetails ? 'rotate-180' : ''}`}
              width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
            ><path d="m6 9 6 6 6-6"/></svg>
          </button>
        </div>
        
        <button 
          className="btn btn-ghost btn-sm text-deepbrown hover:bg-blue-50 gap-2 rounded-lg"
          onClick={() => setIsEditModalOpen(true)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
          {t('Edit/Update Parameters')}
        </button>
      </div>
      <div className="p-4 md:p-6">
        {/* Primary Info Grid (Always Visible) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4">
          <div className="col-span-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase">{t('Name')}</p>
            <p className="text-sm font-semibold text-deepbrown truncate">{formulation.name || '—'}</p>
          </div>
          <div className="col-span-1 md:col-span-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase">{t('Animal Group')}</p>
            <p className="text-sm font-semibold text-deepbrown">{formulation.animal_group || '—'}</p>
          </div>
          <div className="col-span-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase">{t('Body Weight')}</p>
            <p className="text-sm font-semibold text-deepbrown">
              {formulation.body_weight || 0} <span className="text-xs font-normal text-gray-500">kg</span>
            </p>
          </div>
        </div>
        {/* Collapsible Secondary Info */}
        <motion.div
          initial={false}
          animate={{ height: (showAllDetails || window.innerWidth < 768) ? "auto" : 0, opacity: (showAllDetails || window.innerWidth < 768) ? 1 : 0 }}
          className="overflow-hidden"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-6 gap-y-5 mt-5 pt-5 border-t border-gray-50">
            <div className="col-span-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase">{t('Code')}</p>
              <p className="text-sm font-semibold text-deepbrown">{formulation.code || '—'}</p>
            </div>
            <div className="col-span-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase">{t('DM Intake')}</p>
              <p className="text-sm font-semibold text-deepbrown">
                {formulation.dmintake.toFixed(2) || 0} <span className="text-xs font-normal text-gray-500">kg/d</span>
              </p>
            </div>
            {(formulation.animal_group === "Cow | Inahing kalabaw" || formulation.animal_group === "Heifer | Dumalaga") && (
              <div className="col-span-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase">{t('Pregnancy')}</p>
                <div className="inline-flex items-center gap-1.5 text-deepbrown font-bold text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                  {formulation.pregnant_phase > 8 ? t('Late ({{phase}}m)', { phase: formulation.pregnant_phase }) : 
                   formulation.pregnant_phase > 0 ? t('Early ({{phase}}m)', { phase: formulation.pregnant_phase }) : 
                   formulation.pregnant_phase === 0 ? t('Not Pregnant') : t('No info')}
                </div>
              </div>
            )}
            {formulation.animal_group === "Cow | Inahing kalabaw" && (
              <>
                <div className="col-span-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">{t('Lactation')}</p>
                  <p className="text-sm font-bold text-blue-700">{formulation.lactating_phase || '—'}</p>
                </div>
              </>
            )}
            <div className="col-span-2 md:col-span-4 lg:col-span-6">
              <p className="text-[10px] font-bold text-gray-400 uppercase">{t('Description')}</p>
              <p className="text-sm text-deepbrown italic">
                {formulation.description || t('No description provided.')}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )}
</AnimatePresence>

    </div>

    {/* 5. DIRTY ALERT */}
    {isDirty && (
      <div className="alert alert-error alert-soft text-sm py-2">
        <Warning />
        <span>{t('Formula constraints changed. Optimize and Save.')}</span>
      </div>
    )}
  </div>
          
          {/* Box showing missing nutrients after optimization */}
          {missingNutrientsValue.length > 0  && (
            <div className="my-4">
              <div className="rounded-lg border border-yellow-400 bg-yellow-50 p-3 shadow-sm">
                <div className="font-semibold text-yellow-700 mb-2 flex items-center gap-2">
                  <Warning /> {t('Nutrients Still Missing')}
                </div>
                <ul className="list-disc pl-5 text-sm text-yellow-800">
                    {missingNutrientsValue.map((n, i) => (
                      <li key={i}>{n}</li>
                    ))}
                </ul>
              </div>
            </div>
          )
          }
          { !advancedPressed ? (<>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Roughage Table */}
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="p-4 pb-2">
                  <h3 className="mb-1 text-sm font-semibold">{t('Roughage (Approx. 70% of total feed)')}</h3>
                  <p className="flex items-center gap-1 text-xs text-gray-500">
                    <Info /> {t('Contains Grasses, Legumes, and other by-products.')}
                  </p>
                  
                  <div className="mt-3 flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="toggle-roughage-limits"
                      className="checkbox checkbox-success checkbox-xs rounded-md" 
                      checked={showRoughageLimits}
                      onChange={(e) => setShowRoughageLimits(e.target.checked)}
                    />
                    <label htmlFor="toggle-roughage-limits" className="cursor-pointer text-[11px] font-medium text-gray-600 uppercase tracking-wider">
                      {t('Add/Show Amount Limit')}
                    </label>
                  </div>
                </div>
                <div className="max-h-64 overflow-x-auto overflow-y-auto">
                  <table className="table-sm table-pin-rows table w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th>{t('Name')}</th>
                        {showRoughageLimits && (
                          <>
                            <th className="text-center">{ispercentcompute ? t('Min (%)') : t('Min (kg)')}</th>
                            <th className="text-center">{ispercentcompute ? t('Max (%)') : t('Max (kg)')}</th>
                          </>
                        )}
                        <th>{ispercentcompute ? t('Amount (%)') : t('Amount (kg)')}</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>{renderIngredientsTableRows('roughage')}</tbody>
                  </table>
                </div>
                <div className="p-4 border-t border-gray-100">
                  <button
                    disabled={isDisabled}
                    onClick={() => {setIsChooseIngredientsModalOpen(true); setFilterIngredientCode('roughage')}}
                    className="bg-green-button flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm text-white transition-colors hover:bg-green-600 active:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                  >
                    <RiAddLine /> {t('Add Roughage')}
                  </button>
                </div>
              </div>

            {/* Concentrate Table */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <div className="p-4">
                <h3 className="mb-1 text-sm font-semibold">{t('Concentrate (Approx. 27% of total feed)')}</h3>
                <p className="flex text-xs text-gray-500 mb-2">
                  <Info /> {t('Contains Food with Concentrated Nutrients (27% max)')}
                </p>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="toggle-concentrate-limits"
                    className="checkbox checkbox-success checkbox-xs rounded-md" 
                    checked={showConcentrateLimits}
                    onChange={(e) => setShowConcentrateLimits(e.target.checked)}
                  />
                  <label htmlFor="toggle-concentrate-limits" className="cursor-pointer text-[11px] font-medium text-gray-600 uppercase tracking-wider">
                    {t('Add/Show Amount Limit')}
                  </label>
                </div>
              </div>
              <div className="max-h-64 overflow-x-auto overflow-y-auto">
                <table className="table-sm table-pin-rows table w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-sm">{t('Name')}</th>
                      {showConcentrateLimits && (
                        <>
                          <th className="text-center text-sm">{ispercentcompute ? t('Min (%)') : t('Min (kg)')}</th>
                          <th className="text-center text-sm">{ispercentcompute ? t('Max (%)') : t('Max (kg)')}</th>
                        </>
                      )}
                      <th className="text-sm">{ispercentcompute ? t('Amount (%)') : t('Amount (kg)')}</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>{renderIngredientsTableRows('concentrate')}</tbody>
                </table>
              </div>
              <div className="p-4 border-t border-gray-100">
                <button
                  disabled={isDisabled}
                  onClick={() => {
                    setIsChooseIngredientsModalOpen(true); 
                    setFilterIngredientCode('concentrate');
                  }}
                  className="bg-green-button flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm text-white transition-colors hover:bg-green-600 active:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  <RiAddLine /> {t('Add Concentrate')}
                </button>
              </div>
            </div>
            
          </div>

          {/* Vitamins Table */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <div className="p-4">
                <h3 className="mb-2 text-sm font-semibold">{t('Mineral Supplement (Maximum 3% of total feed, can be zero if mineral block is supplemented)')}</h3>
                <p className="flex text-xs text-gray-500 mb-3">
                  <Info /> {t('Contains Minerals.')}
                </p>
                <div className="flex items-center gap-2 mb-1">
                  <input 
                    type="checkbox" 
                    id="toggle-vitamin-limits"
                    className="checkbox checkbox-success checkbox-xs rounded-md" 
                    checked={showVitaminLimits}
                    onChange={(e) => setShowVitaminLimits(e.target.checked)}
                  />
                  <label htmlFor="toggle-vitamin-limits" className="cursor-pointer text-[11px] font-medium text-gray-600 uppercase tracking-wider">
                    {t('Add/Show Amount Limit')}
                  </label>
                </div>
              </div>
              <div className="max-h-64 overflow-x-auto overflow-y-auto">
                <table className="table-sm table-pin-rows table w-full">
                  <thead>
                    <tr className="bg-gray-50 text-xs">
                      <th>{t('Name')}</th>
                      {showVitaminLimits && (
                        <>
                          <th className="text-center">{ispercentcompute ? t('Min (%)') : t('Min (kg)')}</th>
                          <th className="text-center">{ispercentcompute ? t('Max (%)') : t('Max (kg)')}</th>
                        </>
                      )}
                      <th>{ispercentcompute ? t('Amount (%)') : t('Amount (kg)')}</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>{renderIngredientsTableRows('vitamins')}</tbody>
                </table>
              </div>
              <div className="p-4 border-t border-gray-100">
                <button
                  disabled={isDisabled}
                  onClick={() => {
                    setIsChooseIngredientsModalOpen(true); 
                    setFilterIngredientCode('vitamins');
                  }}
                  className="bg-green-button flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm text-white transition-colors hover:bg-green-600 active:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  <RiAddLine /> {t('Add Vitamins Minerals')}
                </button>
              </div>
            </div>
            </>) : (<>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
            
            <div className={`overflow-hidden rounded-xl border border-gray-200 bg-white ${constraintMode === 'percent' ? 'sm:lg:col-span-5 lg:col-span-2' : 'sm:col-span-5 lg:col-span-3'}`}>
  <div className="p-4">
    <div className="mb-2 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
      <h3 className="text-sm font-semibold">{t('All Ingredients (kg)')}</h3>
      
      {/* Dynamic Constraint Mode Dropdown */}
      <div className="flex items-center gap-2">
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('Constraints:')}</label>
        <select 
          className="select select-bordered select-xs rounded-lg font-medium text-deepbrown"
          value={constraintMode}
          onChange={(e) => setConstraintMode(e.target.value)}
        >
          <option value="none">{t('No Limits/Hide Limits')}</option>
          <option value="kg">{t('Fixed')}</option>
          <option value="percent">{t('Manual Percentage (%)')}</option>
        </select>
      </div>
    </div>
    <p className="flex items-center gap-1 text-xs text-gray-500">
      <Info size={14} /> 
      <span>
        {constraintMode === 'percent' 
          ? t('Enter constraints as % of total formulation weight.') 
          : t('Shows all ingredients in the formulation in kilograms.')}
      </span>
    </p>
  </div>
  <div className="max-h-64 overflow-x-auto overflow-y-auto no-scrollbar">
    <table className="table-sm table-pin-rows table w-full">
      <thead>
        <tr>
          <th className="text-deepbrown">{t('Name')}</th>
          {constraintMode !== 'none' && (
            <>
              <th className="text-deepbrown text-center">
                 {constraintMode === 'percent' ? '(%)' : !ispercentcompute ? t('Min (kg)') : t('Min (%)')}
              </th>
              {constraintMode !== 'percent' && <th className="text-deepbrown text-center">
                {constraintMode === 'percent' ? '(%)' : !ispercentcompute ? t('Max (kg)') : t('Max (%)')}
              </th>}
            </>
          )}
          <th className="text-deepbrown">{t('Classification')}</th>
          {constraintMode !== 'percent' && (
            <>
            <th className="text-deepbrown">{ispercentcompute ? t('Amount (%)') : t('Amount (kg)')}</th>
            <th className="text-deepbrown">{ispercentcompute ? t('Total (kg)') : t('Total (%)')}</th>
            </>
          )}
          <th></th>
        </tr>
      </thead>
      <tbody>
        {
        (ispercentcompute ? percentingredients : ingredients).map((ingredient, index) => (
          <tr key={index} className="hover:bg-base-200/50 transition-colors ">
            <td className="text-gray-700 hover:bg-green-button items-center rounded text-sm font-medium hover:text-white cursor-pointer"
            onClick={() => handleIngredientClick(ingredient)}>
              {ingredient.name}
            </td>
            
            {/* Dynamic Inputs */}
            {constraintMode !== 'none' && (
              <>
                {/* Min Input */}
                <td>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      className="input input-bordered input-xs w-20 pr-6"
                      placeholder="N/A"
                      value={ingredient.minimum || ''}
                      onChange={(e) => {
                        const inputValue = e.target.value;
                        if (
                          /^N\/A(\d+|\.)/.test(inputValue) ||
                          /^\d*\.?\d{0,2}$/.test(inputValue)
                        ) {
                          let processedValue = /^N\/A\d*/.test(inputValue)
                            ? inputValue.replace('N/A', '')
                            : inputValue;
                          if (ispercentcompute && processedValue !== '' && Number(processedValue) > 100) {
                            processedValue = '100';
                          }
                        handleIngredientMinimumChange(ingredient.ingredient_id, processedValue)}
                      }}
                    />
                    {constraintMode === 'percent' && (
                      <span className="absolute right-2 text-[10px] text-gray-400">%</span>
                    )}
                  </div>
                </td>
                {/* Max Input */}
                {constraintMode !== 'percent' &&
                <td>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      className="input input-bordered input-xs w-20 pr-6"
                      placeholder="N/A"
                      value={ingredient.maximum || ''}
                      onChange={(e) => {
                        const inputValue = e.target.value;
                        if (
                          /^N\/A(\d+|\.)/.test(inputValue) ||
                          /^\d*\.?\d{0,2}$/.test(inputValue)
                        ) {
                          let processedValue = /^N\/A\d*/.test(inputValue)
                            ? inputValue.replace('N/A', '')
                            : inputValue;
                          if (ispercentcompute && processedValue !== '' && Number(processedValue) > 100) {
                            processedValue = 100;
                          }
                        handleIngredientMaximumChange(ingredient.ingredient_id, processedValue)}
                      }}
                    />
                    {constraintMode === 'percent' && (
                      <span className="absolute right-2 text-[10px] text-gray-400">%</span>
                    )}
                  </div>
                </td>
                }
              </>
            )}
            <td className="text-gray-500 text-xs uppercase">{ingredient.group}</td>
            {constraintMode !== 'percent' && (
              <>
              <td className="font-mono font-bold text-deepbrown">
                {ispercentcompute ? ingredient.value.toFixed(3) + " %" : ingredient.value.toFixed(3) + " kg"}
            </td>
            <td className="font-mono font-bold text-deepbrown">
              {ispercentcompute ? ((ingredient.value*percentweight)/100).toFixed(2) + " kg": (ingredient.value.toFixed(3)/weight *100).toFixed(1) + " %" }
            </td>
              </>
          )}
            <td className="text-right">
              <button
                disabled={isDisabled}
                className="btn btn-ghost btn-xs text-red-400 hover:text-red-600 hover:bg-red-50"
                onClick={() => handleRemoveIngredient(ingredient)}
              >
                <RiDeleteBinLine size={14} />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
  {constraintMode === 'none' && ingredients?.some(ing => 
    (ing.minimum && parseFloat(ing.minimum) !== 0) || 
    (ing.maximum && parseFloat(ing.maximum) !== 0)
  ) && (
    <div className="mx-4 mt-2 mb-4 p-3 rounded-lg bg-orange-50 text-orange-800 text-xs flex items-start gap-2 border border-orange-200">
      <Info size={16} className="mt-0.5 flex-shrink-0" />
      <span>
        <strong>{t('Precaution:')}</strong> {t('You have set strict limits greater than zero. Please ensure the formulation can mathematically satisfy these constraints to avoid calculation errors.')}
      </span>
    </div>
  )}
  <div className="p-4 border-t border-gray-50 bg-gray-50/50 flex flex-row space-x-5">
    <button
      disabled={isDisabled}
      onClick={() => setIsChooseIngredientsModalOpen(true)}
      className="bg-green-button flex items-center gap-2 rounded-xl px-4 py-2 text-sm text-white shadow-sm hover:bg-green-600 active:transform active:scale-95 transition-all disabled:bg-gray-300"
    >
      <RiAddLine /> {t('Add ingredient')}
    </button>
    
    {constraintMode === 'percent' && (
      <button
      disabled={isDisabled}
      onClick={() => handleManualOptimize()}
      className="bg-yellow-400 flex items-center gap-2 rounded-xl px-4 py-2 text-sm text-deepbrown shadow-sm hover:bg-green-600 active:transform active:scale-95 transition-all disabled:bg-gray-300"
    >
      <RiCalculatorLine /> {t('Manual Solve')}
    </button>
    )}
  </div>
</div>

        {constraintMode === 'percent' && (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white sm:mt-0 mt-4 md:col-span-3">
      <ManualFormulation
        isOpen={isManualFormulationOpen}
        onClose={()=>setIsManualFormulationOpen(false)}
        results={optimizationResults}
        onGenerateReport={() => {
          setIsResultsModalOpen(false);
          setIsCustomizationModalOpen(true);
        }}
        formulation={formulationRealTime}
      />
      </div>
         ) }

            {/* Nutrients section */}
          {constraintMode !== 'percent' &&(
            
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white sm:mt-0 mt-4 sm:col-span-5 lg:col-span-2">
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold">{t('Nutrients (g)')}</h3>
                    {/* Reference Button */}
                    {formulation.animal_group !== "Calf (0-4 months) - lower than 100kg | Bulo (0 - 4 na buwan)" && (
                      <>
                        <button 
                        onClick={() => setIsPCCModalOpen(true)}
                        className="btn btn-ghost btn-xs text-blue-600 hover:bg-blue-50 flex items-center gap-1"
                      >
                        <RiBookLine /> {t('Reference:')} <div className='lg:block hidden'> {t('PCC Book')}</div>
                      </button>
                      <button 
                        onClick={() => resetFormulationToInitialState()}
                        className="btn btn-ghost btn-xs text-red-600 hover:bg-blue-50 flex items-center gap-1"
                      >
                        <RiBookLine /> {t('Reset')} <div className='lg:block hidden'> {t('to PCC Reference')}</div>
                      </button>
                    </>
                    )}
                  </div>
                </div>
                
                <p className="flex text-xs text-gray-500">
                  <Info className="mr-1" /> {t('Shows all nutrients in the formulation in grams.')}
                </p>
              </div>
              <div className="max-h-64 overflow-x-auto overflow-y-auto">
                <table className="table-sm table-pin-rows table w-full">
                  <thead>
                    <tr>
                      <th>{t('Name')}</th>
                      <th>{t('Min (g)')}</th>
                      <th>{t('Max (g)')}</th>
                      <th>{ispercentcompute ? t('Amount (g)') : t('Amount (g)')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(ispercentcompute ? percentnutrients : nutrients).map((nutrient, index) => (
                      <tr key={nutrient.nutrient_id || index} className="hover:bg-base-300">
                        <td className="font-medium">{nutrient.name}</td>
                        {/* Minimum Input */}
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
                                if (
                                  /^N\/A(\d+|\.)/.test(inputValue) ||
                                  /^\d*\.?\d{0,2}$/.test(inputValue)
                                ) {
                                  const processedValue = /^N\/A\d*/.test(inputValue)
                                    ? inputValue.replace('N/A', '')
                                    : inputValue
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
                        {/* Maximum Input */}
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
                                if (
                                  /^N\/A(\d+|\.)/.test(inputValue) ||
                                  /^\d*\.?\d{0,2}$/.test(inputValue)
                                ) {
                                  const processedValue = /^N\/A\d*/.test(inputValue)
                                    ? inputValue.replace('N/A', '')
                                    : inputValue
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
                        const avg = (Number(n.minimum || 0) + Number(n.maximum || 0)) / 2;
                        return (
                          <div key={n.nutrient_id} className="grid grid-cols-2 py-1 text-sm border-b border-gray-50">
                            <span>{n.name}</span>
                            <span className="text-right font-mono">{avg.toFixed(2)}g</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="modal-action">
                      <button className="btn btn-sm" onClick={() => setIsPCCModalOpen(false)}>{t('Close')}</button>
                    </div>
                  </div>
                </div>
              )}
              <div className="p-4">
                <button
                  disabled={isDisabled}
                  onClick={() => setIsChooseNutrientsModalOpen(true)}
                  className="bg-green-button flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm text-white transition-colors hover:bg-green-600 active:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  <RiAddLine /> {t('Add nutrient')}
                </button>
              </div>
            </div>)}
            </div>

            {/* Nutrient Ratio Constraints Table */}
             {constraintMode !== 'percent' && (
            
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white mt-4">
              <div className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="mb-2 text-sm font-semibold">{t('Nutrient Ratio Constraints')}</h3>
                  <p className="flex text-xs text-gray-500">
                    <Info /> {t('Set constraints between two nutrients (e.g., Protein : Fat ≥ 2:1).')}
                  </p>
                </div>
                <button
                  disabled={isDisabled}
                  onClick={() => {
                    setNutrientRatioModifyType('add');
                    setIsChooseNutrientRatiosModalOpen(true);
                  }}
                  className="bg-green-button flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm text-white transition-colors hover:bg-green-600 active:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
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
          
          {constraintMode !== 'percent' ? (
            <div className="flex flex-wrap justify-end gap-2 px-4 pb-5 md:mb-0 mb-15 md:mt-0 mt-5">
            
            <div className="flex items-center justify-end gap-1 pr-2">
              <span className="text-sm font-medium text-gray-600">
                {t('Amount to be Fed (kg):')}
              </span>
              <span className="text-green-button text-lg font-bold underline">
                <div>
                  <input
                    id="input-weight"
                    type="text"
                    className="input input-bordered w-[80px] rounded-xl"
                    disabled={isDisabled}
                    value={ispercentcompute ? percentweight : weight}
                    onFocus={(e) =>
                      updateMyPresence({ focusedId: e.target.id })
                    }
                    onBlur={() => updateMyPresence({ focusedId: null })}
                    onChange={(e) => {
                      if (ispercentcompute){
                        if (e.target.value === ' ') {
                          updatePercentWeight(100)
                        } else {
                          updatePercentWeight(e.target.value)
                        }
                      } else {
                        if (e.target.value === '') {
                          updateWeight(100)
                        } else {
                          updateWeight(e.target.value)
                        }
                      }
                    }}
                    maxLength={20}
                  />
                  <Selections id="input-weight" others={others} />
                </div>
              </span>
            </div>
            {/* Total Cost */}
            <div className="flex items-center justify-end gap-1 pr-2 ">
              <span className="text-sm font-medium text-gray-600">
                {t('Total cost (per {{weight}} kg):', { weight })}
              </span>
              <span className="text-green-button text-lg font-bold underline">
                ₱ {cost && cost.toFixed(2)}
              </span>
            </div>
            
          </div>
            
          ): <div className='w-full mb-10 bg-white h-10'></div>}
          
        </div>
      </div>

      {/*  Modals */}
      <ShareFormulationModal
        isOpen={isShareFormulationModalOpen}
        onClose={() => setIsShareFormulationModalOpen(false)}
        onAdd={goToConfirmationModal}
        onEdit={handleUpdateCollaborator}
        onDelete={handleDeleteCollaborator}
        userId={user?._id}
        formulation={formulation}
        collaborators={collaborators}
      />
      <ConfirmationModal
        isOpen={isAddCollaboratorModalOpen}
        onClose={() => setIsAddCollaboratorModalOpen(false)}
        onConfirm={handleAddCollaborator}
        title={t('Add collaborator')}
        description={
          <>
            {t('Add')} <strong>{newCollaborator.newEmail}</strong> {t('as a collaborator to this formulation?')}
          </>
        }
        type="add"
      />
      <ShadowPricingTab
        open={shadowPricingTabOpen}
        onClose={()=>setShadowPricingTabOpen(false)}
        data={shadowPrices}
      />
      <ChooseIngredientsModal
        isOpen={isChooseIngredientsModalOpen}
        onClose={() => setIsChooseIngredientsModalOpen(false)}
        ingredients={ingredientsMenu}
        onResult={handleAddIngredients}
        ingredientsFilter={filterIngredientCode}
      />
      <ChooseNutrientsModal
        isOpen={isChooseNutrientsModalOpen}
        onClose={() => setIsChooseNutrientsModalOpen(false)}
        nutrients={nutrientsMenu}
        onResult={handleAddNutrients}
      />
      <ChooseNutrientRatiosModal
        isOpen={isChooseNutrientRatiosModalOpen}
        onClose={() => {
          setIsChooseNutrientRatiosModalOpen(false);
          setEditingNutrientRatioIndex(null);
          setNutrientRatioToEdit(null);
        }}
        nutrients={nutrients}
        allNutrients={listOfNutrients}
        onResult={(newRatio) => {
          updateNutrientRatioConstraints([...(nutrientRatioConstraints || []), newRatio]);
        }}
        onUpdate={handleUpdateNutrientRatio}
        type={nutrientRatioModifyType}
        editingNutrientRatio={nutrientRatioToEdit}
      />
      <Progress
        open={progressPressed}
        onClose={() => setProgressPressed(false)}
        weightProgress={formulation.weightProgress}
        milkYieldProgress={formulation.milkYieldProgress}
        typeProgress={formulation.typeProgress}
        dateProgress={formulation.dateProgress}
      />
      {/*  Toasts */}
      <Toast
        className="transition delay-150 ease-in-out"
        show={showToast}
        action={toastAction}
        message={message}
        onHide={hideToast}
      />
        <OptimizeFAB
          handleOptimize={handleOptimize}
        />
      
      <OptimizationResultsModal 
        isOpen={isResultsModalOpen}
        results={optimizationResults}
        onClose={() => setIsResultsModalOpen(false)}
        onGenerateReport={() => {
          setIsResultsModalOpen(false);
          setIsCustomizationModalOpen(true);
        }}
        formulation={formulationRealTime}
        goToPercent={
          () => {
            setAdvancedPressed(true);
            setConstraintMode('percent');
            setIsResultsModalOpen(false);
            percentFormulationToInitialStateIngredients();
          }
        }
        ispercentcompute={ispercentcomputeLast}
      />
      {ispercentcompute ? <UserCustomizationModal
        isOpen={isCustomizationModalOpen}
        onClose={() => setIsCustomizationModalOpen(false)}
        onGenerate={handleGenerateReport}
        userAccess={userAccess}
        formulation={percentFormulationRealTime}
        owner={owner}
        weight={weight}
        shadowPrices={shadowPrices}
        isCustomizationModalOpen={isCustomizationModalOpen}
        setIsCustomizationModalOpen={setIsCustomizationModalOpen}
      />:
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
      />
    
    }
      
      <EditFormulationModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        formulation={formulation}
        onResult={handleEditResult}
      />
      <IngredientSubstituteModal 
        isOpen={isSubModalOpen} 
        onClose={() => setIsSubModalOpen(false)} 
        modalData={modalData}
        substitutesLoading={substitutesLoading}
      />
      <InfeasibilityModal
        isOpen={infeasibilityModal.isOpen}
        onClose={() => setInfeasibilityModal(prev => ({ ...prev, isOpen: false }))}
        diagnosisData={infeasibilityModal.data}
      />
      
    </div>
  )
}

function Selections({ id, others }) {
  return (
    <>
      {others.map(({ connectionId, info, presence }) => {
        if (presence.focusedId === id) {
          return (
            <Selection
              key={connectionId}
              name={info.name}
              color={COLORS[connectionId % COLORS.length]}
            />
          )
        }
      })}
    </>
  )
}

export default ViewFormulation
