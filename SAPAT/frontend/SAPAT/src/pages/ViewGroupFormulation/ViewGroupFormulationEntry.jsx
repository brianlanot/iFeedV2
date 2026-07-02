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
import ViewGroupFormulation from './ViewGroupFormulation.jsx'
import Toast from '../../components/Toast.jsx'

function ViewGroupFormulationEntry({ id }) {
  const VITE_API_URL = import.meta.env.VITE_API_URL
  const { user, loading } = useAuth()
  const others = useOthers()
  const self = useSelf()
  const updateMyPresence = useUpdateMyPresence()

  const formulationRealTime = useStorage((root) => root.formulation)
  const nutrientsMenu = useStorage((root) => root.formulation?.nutrientsMenu || [])
  const ingredientsMenu = useStorage((root) => root.formulation?.ingredientsMenu || [])
  const nutrientRatioConstraints = useStorage((root) => root.formulation?.nutrientRatioConstraints || [])

  const updateNutrientsMenu = useMutation(({ storage }, newMenu) => {
    storage.get('formulation').set('nutrientsMenu', newMenu)
  }, [])
  const updateIngredientsMenu = useMutation(({ storage }, newMenu) => {
    storage.get('formulation').set('ingredientsMenu', newMenu)
  }, [])
  const updateNutrientRatioConstraints = useMutation(({ storage }, newConstraints) => {
    storage.get('formulation').set('nutrientRatioConstraints', newConstraints)
  }, [])

  // special formulation based on animal group
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

  // Update a specific ingredient's property
  const updateIngredientProperty = useMutation(
    ({ storage }, ingredientId, propertyName, propertyValue) => {
      const ingredients = storage.get('formulation').get('ingredients')
      // Create a new array with the updated ingredient
      const updatedIngredients = ingredients.map((ingredient) =>
      ingredient.ingredient_id === ingredientId || ingredient._id === ingredientId
        ? { ...ingredient, [propertyName]: propertyValue }
        : ingredient
      );

      console.log("Room Ingredients Here", ingredients)
      console.log("Updated Room Ingredients here", updatedIngredients)
      // Update the entire ingredients array
      storage.get('formulation').set('ingredients', updatedIngredients)
    },
    []
  )

  // Update a specific nutrient's property
  const updateNutrientProperty = useMutation(
    ({ storage }, nutrientId, propertyName, propertyValue) => {
      const nutrients = storage.get('formulation').get('nutrients')
      console.log("Room Nutrients Here:", nutrients)
      // Create a new array with the updated nutrient
      const updatedNutrients = nutrients.map((nutrient) =>
        nutrient.nutrient_id === nutrientId || nutrient._id === nutrientId
          ? { ...nutrient, [propertyName]: propertyValue }
          : nutrient
      )
      // Update the entire nutrients array
      storage.get('formulation').set('nutrients', updatedNutrients)
      console.log("After update:", storage.get('formulation').get('nutrients'))
    },
    []
  )

  // Update shadow prices in real-time storage
  const updateShadowPrices = useMutation(({ storage }, shadowPrices) => {
    storage.get('formulation').set('shadowPrices', shadowPrices)
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
  // toast visibility
  const [showToast, setShowToast] = useState(false)
  const [message, setMessage] = useState('')
  const [toastAction, setToastAction] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [formulations, setFormulations] = useState([])

  const [groupFormulationName, setGroupFormulationName] = useState('')
  const [groupFormulationDescription, setGroupFormulationDescription] = useState('')
  const formulationRef = useRef(formulationRealTime)

  const hideToast = () => {
    setShowToast(false)
    setMessage('')
    setToastAction('')
  }

  useEffect(() => {
    formulationRef.current = formulationRealTime

  }, [formulationRealTime])

  useEffect(() => {
    if (user) {
      fetchFormulationData()
      // console.log("HELLO WORLD")
      // checkAccess()
    }
  }, [user])
  

  // const fetchspecialformulations = async (animal_group) => {
  //       try {
  //         const res = await axios.get(`${VITE_API_URL}/formulation/special/${animal_group}`)
  //         setSpecialFormulations(res.data.formulations)
  //         console.log('Special formulations fetched:', res.data)
  //       } catch (error) {
  //         console.error('Error fetching special formulations:', error)
  //       }
  //     }

const fetchFormulationData = async () => {
  try {
    const response = await axios.get(`${VITE_API_URL}/groupformulations/${id}`)
    const formulations = await axios.get(
          `${VITE_API_URL}/groupformulations/${id}/user/${user?._id}/formulations`
        );

    setFormulations(formulations.data.formulations);
    console.log("Here are the formulations: ", formulations)
    const groupFormulation = response.data.groupFormulation
    if (!groupFormulation.formulationDetails || groupFormulation.formulationDetails.length === 0) {
      console.warn("No formulationDetails in this group")
      return
    }

    // Take the first formulationDetails
    const formulationData = groupFormulation.formulationDetails[0]
    setFormulation(formulationData)
    setGroupFormulationDescription(groupFormulation.description)
    setGroupFormulationName(groupFormulation.name)

    // update contents of liveblocks storage based on the database (when there are no other people editing yet)
    if (others.length === 0) {
      updateCode(formulationData.code)
      updateName(formulationData.name)
      updateDescription(formulationData.description)
      updateAnimalGroup(formulationData.animal_group)
      updateCost(formulationData.cost)
      updateIngredients(formulationData.ingredients)
      updateNutrients(formulationData.nutrients)
      
      // Ensure nutrientRatioConstraints have both name and ID fields
      const patchedNutrientRatioConstraints = (formulationData.nutrientRatioConstraints || []).map(constraint => {
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
    }

    // set owner id
    const owner = user?._id
    console.log("USER ID HERE:", user)
    setOwnerId(owner)
    setIsLoading(false)
  } catch (err) {
    console.log("ERROR fetching group formulation:", err)
    setIsLoading(false)
  }
}

  // const checkAccess = async () => {
  //   try {
  //     const res = await axios.get(
  //       `${VITE_API_URL}/formulation/collaborator/${id}/${user._id}`
  //     )
  //     if (res.data.access === 'notFound') {
  //       setShouldRedirect(true)
  //     }
  //     setUserAccess(res.data.access)
  //   } catch (err) {
  //     console.log(err)
  //   }
  // }
  
  const updateDatabase = async (isDirty = false) => {

    if (isDirty) {
      setShowToast(true) // Show success toast
      setMessage('Changes not saved! Click "Optimize" before saving changes.')
      setToastAction('error')
      return
    }

    try {
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
      setShowToast(true) // Show success toast
      setMessage('Formulation saved to database!')
      setToastAction('success')
    } catch (error) {
      console.error('Error updating database:', error)
      setShowToast(true) // Show success toast
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
      <ViewGroupFormulation
        formulation={formulation}
        owner={ownerId}
        userAccess={userAccess}
        id={id}
        user={user}
        self={self}
        others={others}
        updateMyPresence={updateMyPresence}
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
        handleSave={updateDatabase}
        updateShadowPrices={updateShadowPrices}
        shadowPrices={formulationRealTime?.shadowPrices || []}
        nutrientsMenu={nutrientsMenu}
        updateNutrientsMenu={updateNutrientsMenu}
        ingredientsMenu={ingredientsMenu}
        updateIngredientsMenu={updateIngredientsMenu}
        nutrientRatioConstraints={nutrientRatioConstraints}
        updateNutrientRatioConstraints={updateNutrientRatioConstraints}
        formulations = {formulations}
        groupFormulationName = {groupFormulationName}
        groupFormulationDescription = {groupFormulationDescription}
      />
      {/*  Toasts */}
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

export default ViewGroupFormulationEntry