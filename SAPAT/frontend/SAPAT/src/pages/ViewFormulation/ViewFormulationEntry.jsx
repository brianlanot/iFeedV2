'use client'

import {
  useOthers,
  useSelf,
  useUpdateMyPresence,
  useMutation,
  useStorage,
} from '@liveblocks/react/suspense'
import { Navigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import useAuth from '../../hook/useAuth.js'
import Loading from '../../components/Loading.jsx'
import ViewFormulation from './ViewFormulation.jsx'
import Toast from '../../components/Toast.jsx'

function ViewFormulationEntry({ id }) {
  const VITE_API_URL = import.meta.env.VITE_API_URL
  const { user, loading } = useAuth()
  const others = useOthers()
  const self = useSelf()
  const updateMyPresence = useUpdateMyPresence()

  // --- STANDARD FORMULATION STORAGE ---
  const formulationRealTime = useStorage((root) => root.formulation)
  const nutrientsMenu = useStorage((root) => root.formulation?.nutrientsMenu || [])
  const ingredientsMenu = useStorage((root) => root.formulation?.ingredientsMenu || [])
  const nutrientRatioConstraints = useStorage((root) => root.formulation?.nutrientRatioConstraints || [])

  // --- PERCENT FORMULATION STORAGE ---
  const percentFormulationRealTime = useStorage((root) => root.percentFormulation)

  // --- STANDARD MUTATIONS ---
  const updateNutrientsMenu = useMutation(({ storage }, newMenu) => {
    storage.get('formulation').set('nutrientsMenu', newMenu)
  }, [])
  const updateIngredientsMenu = useMutation(({ storage }, newMenu) => {
    storage.get('formulation').set('ingredientsMenu', newMenu)
  }, [])
  const updateNutrientRatioConstraints = useMutation(({ storage }, newConstraints) => {
    storage.get('formulation').set('nutrientRatioConstraints', newConstraints)
  }, [])

  const [specialformulations, setSpecialFormulations] = useState([]);

  const updateWeight = useMutation(({ storage }, weight) => {
    storage.get('formulation').set('weight', weight)
  }, [])
  const updateCode = useMutation(({ storage }, code) => {
    storage.get('formulation').set('code', code)
  }, [])
  const updateName = useMutation(({ storage }, name) => {
    storage.get('formulation').set('name', name)
  }, [])
  const updateDescription = useMutation(({ storage }, description) => {
    storage.get('formulation').set('description', description)
  }, [])
  const updateAnimalGroup = useMutation(({ storage }, animal_group) => {
    storage.get('formulation').set('animal_group', animal_group)
  }, [])
  const updateCost = useMutation(({ storage }, cost) => {
    storage.get('formulation').set('cost', cost)
  }, [])
  const updateIngredients = useMutation(({ storage }, ingredients) => {
    storage.get('formulation').set('ingredients', ingredients)
  }, [])
  const updateNutrients = useMutation(({ storage }, nutrients) => {
    storage.get('formulation').set('nutrients', nutrients)
  }, [])

  const updateIngredientProperty = useMutation(
    ({ storage }, ingredientId, propertyName, propertyValue) => {
      const ingredients = storage.get('formulation').get('ingredients')
      const updatedIngredients = ingredients.map((ingredient) =>
      ingredient.ingredient_id === ingredientId || ingredient._id === ingredientId
        ? { ...ingredient, [propertyName]: propertyValue }
        : ingredient
      );
      storage.get('formulation').set('ingredients', updatedIngredients)
    },
    []
  )

  const updateNutrientProperty = useMutation(
    ({ storage }, nutrientId, propertyName, propertyValue) => {
      const nutrients = storage.get('formulation').get('nutrients')
      const updatedNutrients = nutrients.map((nutrient) =>
        nutrient.nutrient_id === nutrientId || nutrient._id === nutrientId
          ? { ...nutrient, [propertyName]: propertyValue }
          : nutrient
      )
      storage.get('formulation').set('nutrients', updatedNutrients)
    },
    []
  )

  const updateShadowPrices = useMutation(({ storage }, shadowPrices) => {
    storage.get('formulation').set('shadowPrices', shadowPrices)
  }, [])

  // --- PERCENT FORMULATION MUTATIONS ---
  const updatePercentWeight = useMutation(({ storage }, weight) => {
    storage.get('percentFormulation').set('weight', weight)
  }, [])
  const updatePercentCode = useMutation(({ storage }, code) => {
    storage.get('percentFormulation').set('code', code)
  }, [])
  const updatePercentName = useMutation(({ storage }, name) => {
    storage.get('percentFormulation').set('name', name)
  }, [])
  const updatePercentDescription = useMutation(({ storage }, description) => {
    storage.get('percentFormulation').set('description', description)
  }, [])
  const updatePercentAnimalGroup = useMutation(({ storage }, animal_group) => {
    storage.get('percentFormulation').set('animal_group', animal_group)
  }, [])
  const updatePercentCost = useMutation(({ storage }, cost) => {
    storage.get('percentFormulation').set('cost', cost)
  }, [])
  const updatePercentIngredients = useMutation(({ storage }, ingredients) => {
    storage.get('percentFormulation').set('ingredients', ingredients)
  }, [])
  const updatePercentNutrients = useMutation(({ storage }, nutrients) => {
    storage.get('percentFormulation').set('nutrients', nutrients)
  }, [])

  const updatePercentIngredientProperty = useMutation(
    ({ storage }, ingredientId, propertyName, propertyValue) => {
      const ingredients = storage.get('percentFormulation').get('ingredients')
      const updatedIngredients = ingredients.map((ingredient) =>
      ingredient.ingredient_id === ingredientId || ingredient._id === ingredientId
        ? { ...ingredient, [propertyName]: propertyValue }
        : ingredient
      );
      storage.get('percentFormulation').set('ingredients', updatedIngredients)
    },
    []
  )

  const updatePercentNutrientProperty = useMutation(
    ({ storage }, nutrientId, propertyName, propertyValue) => {
      const nutrients = storage.get('percentFormulation').get('nutrients')
      const updatedNutrients = nutrients.map((nutrient) =>
        nutrient.nutrient_id === nutrientId || nutrient._id === nutrientId
          ? { ...nutrient, [propertyName]: propertyValue }
          : nutrient
      )
      storage.get('percentFormulation').set('nutrients', updatedNutrients)
    },
    []
  )

  const updatePercentShadowPrices = useMutation(({ storage }, shadowPrices) => {
    storage.get('percentFormulation').set('shadowPrices', shadowPrices)
  }, [])


  const [formulation, setFormulation] = useState({
    code: '',
    name: '',
    description: '',
    animal_group: '',
    ingredients: [],
    nutrients: [],
    weightProgress: [],
    milkYieldProgress: [],
    typeProgress: [],
  })
  const [ownerId, setOwnerId] = useState(null)
  const [shouldRedirect, setShouldRedirect] = useState(false)
  const [userAccess, setUserAccess] = useState('')
  const [showToast, setShowToast] = useState(false)
  const [message, setMessage] = useState('')
  const [toastAction, setToastAction] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const formulationRef = useRef(formulationRealTime)
  const percentFormulationRef = useRef(percentFormulationRealTime)

  const hideToast = () => {
    setShowToast(false)
    setMessage('')
    setToastAction('')
  }

  useEffect(() => {
    formulationRef.current = formulationRealTime
  }, [formulationRealTime])

  useEffect(() => {
    percentFormulationRef.current = percentFormulationRealTime
  }, [percentFormulationRealTime])

  useEffect(() => {
    if (user) {
      fetchFormulationData()
      checkAccess()
    }
  }, [user])
  

  const fetchspecialformulations = async (animal_group) => {
        try {
          const res = await axios.get(`${VITE_API_URL}/formulation/special/${animal_group}`)
          setSpecialFormulations(res.data.formulations)
          console.log('Special formulations fetched:', res.data)
        } catch (error) {
          console.error('Error fetching special formulations:', error)
        }
      }

  const fetchFormulationData = async () => {
    try {
      const response = await axios.get(`${VITE_API_URL}/formulation/${id}`)
      const formulationData = response.data.formulations
      setFormulation(formulationData)

      // update contents of liveblocks storage based on the database (when there are no other people editing yet)
      if (others.length === 0) {
        // Init standard formulation
        updateCode(formulationData.code)
        updateName(formulationData.name)
        updateDescription(formulationData.description)
        updateAnimalGroup(formulationData.animal_group)
        updateCost(formulationData.cost)
        updateIngredients(formulationData.ingredients)
        updateNutrients(formulationData.nutrients)

        // Init percent formulation with base data so it has a starting point
        updatePercentCode(formulationData.code)
        updatePercentName(formulationData.name)
        updatePercentDescription(formulationData.description)
        updatePercentAnimalGroup(formulationData.animal_group)
        updatePercentCost(formulationData.cost)
        updatePercentIngredients(formulationData.ingredients)
        updatePercentNutrients(formulationData.nutrients)
        
        let patchedNutrientRatioConstraints = (formulationData.nutrientRatioConstraints || []).map(constraint => {
          if (!constraint.firstIngredientId || !constraint.secondIngredientId) {
            const first = (formulationData.nutrients || []).find(n => n.name === constraint.firstIngredient)
            const second = (formulationData.nutrients || []).find(n => n.name === constraint.secondIngredient)
            return {
              ...constraint,
              firstIngredientId: first ? first.nutrient_id : constraint.firstIngredientId,
              secondIngredientId: second ? second.nutrient_id : constraint.secondIngredientId,
            }
          }
          return constraint
        })
        updateNutrientRatioConstraints(patchedNutrientRatioConstraints)
        fetchspecialformulations(formulationData.animal_group)
      }
      
      const owner = formulationData?.collaborators?.find((collaborator) => collaborator.access === "owner")
      setOwnerId(owner)
      setIsLoading(false)
    } catch (err) {
      console.log(err)
    }
  }

  const checkAccess = async () => {
    try {
      const res = await axios.get(
        `${VITE_API_URL}/formulation/collaborator/${id}/${user?._id}`
      )
      if (res.data.access === 'notFound') {
        setShouldRedirect(true)
      }
      setUserAccess(res.data.access)
    } catch (err) {
      console.log(err)
    }
  }
  
  const updateDatabase = async (isDirty = false) => {

    if (isDirty) {
      setShowToast(true) 
      setMessage('Changes not saved! Click "Optimize" before saving changes.')
      setToastAction('error')
      return
    }

    try {
      // NOTE: Saving standard formulation to DB. If you need to save percentFormulation, you can access it via percentFormulationRef.current
      const currentFormulation = formulationRef.current
      const VITE_API_URL = import.meta.env.VITE_API_URL
      console.log(currentFormulation, "Current Formulation")
      await axios.put(`${VITE_API_URL}/formulation/${id}`, {
        code: currentFormulation.code,
        name: currentFormulation.name,
        description: currentFormulation.description,
        animal_group: currentFormulation.animal_group,
        cost: currentFormulation.cost,
        weight: currentFormulation.weight,
        ingredients: currentFormulation.ingredients,
        nutrients: currentFormulation.nutrients,
        nutrientRatioConstraints: nutrientRatioConstraints,
      })
      setShowToast(true) 
      setMessage('Formulation saved to database!')
      setToastAction('success')
    } catch (error) {
      console.error('Error updating database:', error)
      setShowToast(true) 
      setMessage('Changes not saved! Tap to retry.')
      setToastAction('error')
    }
  }

  if (shouldRedirect) {
    return <Navigate to="/formulations" />
  }

  if (loading) {
    return <Loading />
  }

  if (!user) {
    return <Navigate to="/" />
  }

  if (isLoading) {
    return <Loading />
  }

  return (
    <>
      <ViewFormulation
        formulation={formulation}
        owner={ownerId}
        userAccess={userAccess}
        id={id}
        user={user}
        self={self}
        others={others}
        updateMyPresence={updateMyPresence}
        
        // Standard formulation props
        formulationRealTime={formulationRealTime}
        updateWeight={updateWeight}
        updateCode={updateCode}
        updateName={updateName}
        updateDescription={updateDescription}
        updateAnimalGroup={updateAnimalGroup}
        updateCost={updateCost}
        updateIngredients={updateIngredients}
        updateNutrients={updateNutrients}
        updateIngredientProperty={updateIngredientProperty}
        updateNutrientProperty={updateNutrientProperty}
        updateShadowPrices={updateShadowPrices}
        shadowPrices={formulationRealTime?.shadowPrices || []}

        // Percent formulation props
        percentFormulationRealTime={percentFormulationRealTime}
        updatePercentWeight={updatePercentWeight}
        updatePercentCode={updatePercentCode}
        updatePercentName={updatePercentName}
        updatePercentDescription={updatePercentDescription}
        updatePercentAnimalGroup={updatePercentAnimalGroup}
        updatePercentCost={updatePercentCost}
        updatePercentIngredients={updatePercentIngredients}
        updatePercentNutrients={updatePercentNutrients}
        updatePercentIngredientProperty={updatePercentIngredientProperty}
        updatePercentNutrientProperty={updatePercentNutrientProperty}
        updatePercentShadowPrices={updatePercentShadowPrices}
        percentShadowPrices={percentFormulationRealTime?.shadowPrices || []}

        handleSave={updateDatabase}
        specialformulations={specialformulations}
        nutrientsMenu={nutrientsMenu}
        updateNutrientsMenu={updateNutrientsMenu}
        ingredientsMenu={ingredientsMenu}
        updateIngredientsMenu={updateIngredientsMenu}
        nutrientRatioConstraints={nutrientRatioConstraints}
        updateNutrientRatioConstraints={updateNutrientRatioConstraints}
      />
      {/* Toasts */}
      <Toast
        className="transition delay-150 ease-in-out"
        show={showToast}
        action={toastAction}
        message={message}
        onHide={hideToast}
      />
    </>
  )
}

export default ViewFormulationEntry