import { RiAddLine } from 'react-icons/ri'
import { useState, useEffect } from 'react'
import AddIngredientModal from '../components/modals/ingredients/AddIngredientModal'
import EditIngredientModal from '../components/modals/ingredients/EditIngredientModal'
import ConfirmationModal from '../components/modals/ConfirmationModal'
import Table from '../components/Table'
import Loading from '../components/Loading'
import useAuth from '../hook/useAuth.js'
import { Navigate } from 'react-router-dom'
import axios from 'axios'
import Toast from '../components/Toast.jsx'
import Search from '../components/Search.jsx'
import Export from '../components/buttons/Export.jsx'
import Import from '../components/Import.jsx'
import ImportModal from '../components/modals/ImportModal.jsx'
import Pagination from '../components/Pagination'
import SortBy from '../components/SortBy.jsx'
import FilterBy from '../components/FilterBy.jsx'
import ImagePreviewModal from '../components/modals/ImagePreviewModal.jsx'
import { useTranslation } from 'react-i18next';

function Ingredients() {

  const { t, i18n } = useTranslation();

  const { user, loading } = useAuth()
  const [ingredients, setIngredients] = useState([])
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [selectedIngredient, setSelectedIngredient] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  // toast visibility
  const [showToast, setShowToast] = useState(false)
  const [message, setMessage] = useState('')
  const [toastAction, setToastAction] = useState('')
  // pagination
  const [page, setPage] = useState(1)
  const limit = 8
  const [paginationInfo, setPaginationInfo] = useState({
    totalSize: 0,
    totalPages: 0,
    pageSize: 5,
    page: 1,
  })
  // filters
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState('')
  const [sortBy, setSortBy] = useState('')
  const [sortOrder, setSortOrder] = useState('')
  

  // See Image

  const [viewImageModal, setViewImageModal] = useState(false)
  const [currentImageURL, setCurrentImageURL] =  useState('')
  const [currentDescription, setCurrentDescription] = useState('')
  const [nameImage, setNameImage] = useState('')

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user, searchQuery, sortBy, sortOrder, filters, page])

  const fetchData = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/ingredient/filtered/search/${user?._id}?searchQuery=${searchQuery}&filters=${filters}&sortBy=${sortBy}&sortOrder=${sortOrder}&skip=${(page - 1) * limit}&limit=${limit}`
      )
      const fetchedData = res.data
      setIngredients(fetchedData.fetched)
      setPaginationInfo(fetchedData.pagination)
      setIsLoading(false)
    } catch (err) {
      console.log(err)
    }
  }


  const handleFilterQuery = (type, value) => {
    type === 'query' && setSearchQuery(value)
    type === 'filter' && setFilters(value)
    if (type === 'sort') {
      const [by, order] = value.split('-')
      if (by === 'na') {
        setSortBy('')
        setSortOrder('')
      } else {
        setSortBy(by)
        setSortOrder(order)
      }
    }
    setPage(1)
  }

  const handleEditClick = (ingredient) => {
    setSelectedIngredient(ingredient)
    setIsEditModalOpen(true)
  }

  const handleDeleteClick = (ingredient) => {
    setSelectedIngredient(ingredient)
    setIsDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    try {
      console.log("selectedIngredient", selectedIngredient)
      const selectedId = selectedIngredient.ingredient_id || selectedIngredient._id
      const res = await axios.delete(
        `${import.meta.env.VITE_API_URL}/ingredient/${selectedId}/${user?._id}`
      )
      const messageData = res.data.message
      if (messageData === 'success') {
        const filteredIngredients = ingredients.filter(
          (ingredient) => ingredient.ingredient_id !== selectedId && ingredient._id !== selectedId
        )
        setIngredients(filteredIngredients)
        // when no ingredients on current page are left, go back to show the unfiltered data
        if (filteredIngredients.length === 0) {
          setPage(1)
          setSearchQuery('')
          setFilters('')
          setSortBy('')
          setSortOrder('')
          await fetchData()
        }
      }
      // toast instructions
      setShowToast(true)
      setMessage(
        messageData === 'success'
          ? t('Ingredient deleted successfully')
          : t('Failed to delete ingredient.')
      )
      setToastAction(messageData)
    } catch (err) {
      console.log(err)
      setShowToast(true)
      setMessage(t('Failed to delete ingredient.'))
      setToastAction('error')
    }
  }

  const handleCreateResult = (newIngredient, action, message) => {
    setIsAddModalOpen(false)
    setIngredients([newIngredient, ...ingredients])
    // toast instructions
    setShowToast(true)
    setMessage(message)
    setToastAction(action)
  }

  const handleEditResult = (updatedIngredient, action, message) => {
    setIsEditModalOpen(false)
    setIngredients((prevIngredient) => {
      const index = prevIngredient.findIndex(
        (ingredient) => ingredient._id === updatedIngredient._id || ingredient._id === updatedIngredient.ingredient_id
      )
      const updated = [...prevIngredient]
      updated[index] = { ...updatedIngredient }
      return updated
    })
    // toast instructions
    setShowToast(true)
    setMessage(message)
    setToastAction(action)
  }

  const handleImportClick = () => {
    setIsImportModalOpen(true)
  }

  const handleImportSubmit = async (data, type) => {
    try {
      const payload = {
      ingredientsData: data,
      type: data[0]?.category || 'Uncategorized' 
    };
      setIsLoading(true)
      await axios.post(
        `${import.meta.env.VITE_API_URL}/ingredient/import/${user?._id}`,
        payload
      )
      // refetch ingredients to display updated table
      setSearchQuery('')
      setFilters('')
      setSortBy('')
      setSortOrder('')
      await fetchData()
      setIsLoading(false)
      // toast instructions
      setShowToast(true)
      setMessage('Ingredients successfully imported.')
      setToastAction('success')
    } catch (err) {
      setIsLoading(false)
      // toast instructions
      setShowToast(true)
      setMessage("File too large. Please upload in smaller batches (10-50 ingredients).")
      setToastAction('error')
    }
  }

  const handleExportSubmit = (message, action) => {
    // toast instructions
    setShowToast(true)
    setMessage(message)
    setToastAction(action)
  }

  const handlePageChange = (page) => {
    setPage(page)
  }

  const hideToast = () => {
    setShowToast(false)
    setMessage('')
    setToastAction('')
  }

  const headers = ['Name', 'Price (Php/kg)', 'Group', 'Description']
  const filterOptions = [
    { value: 'Vitamin-Mineral', label: 'Vitamin-Mineral' },
    { value: 'Legumes', label: 'Legumes' },
    { value: 'Grass', label: 'Grass' },
    { value: 'Industrial by-products', label: 'Industrial by-products' },
    { value: 'Agricultural by-products', label: 'Agricultural by-products' },
  ]
  const sortOptions = [
    { value: 'na-default', label: 'Default' },
    { value: 'name-asc', label: 'Name (A-Z)' },
    { value: 'name-desc', label: 'Name (Z-A)' },
    { value: 'group-asc', label: 'Group (A-Z)' },
    { value: 'group-desc', label: 'Group (Z-A)' },
  ]

  const viewImageFunction = (image_url, description, name) => {

    setCurrentImageURL(image_url)
    console.log("DESCRIOTION HERE", name)
    setCurrentDescription(description)
    setNameImage(name)
    setViewImageModal(true)
    
  }

  if (loading) {
    return <Loading />
  }
  if (!user) {
    return <Navigate to="/" />
  }
  // loading due to api calls
  if (isLoading) {
    return <Loading />
  }

  return (
    <div className="flex h-full flex-col bg-gray-50">
      {/* Fixed Header Section */}
      <div className="sticky top-0 z-10 bg-gray-50 p-2 md:p-4">
        <h1 className="text-deepbrown mb-3 text-xl font-bold md:text-2xl">
          {t('Ingredients')}
        </h1>

        {/* Action buttons and search */}
        <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
          {user?.userType === 'admin' && (
            <div className="flex w-full flex-wrap gap-2 md:w-auto">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-green-button flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-sm text-white transition-colors hover:bg-green-600 active:bg-green-700 md:gap-2 md:px-3 md:py-1.5 md:text-base"
              >
                <RiAddLine className="h-4 w-4 md:h-5 md:w-5" />
                <span>{t('Add New')}</span>
              </button>
              <Import onImport={handleImportClick} />
              <Export ingredients={ingredients} onExport={handleExportSubmit} />
            </div>
           )
          }
          
          <div className="flex flex-col flex-wrap gap-2 md:flex-row">
            <div className="flex gap-2">
              <SortBy
                handleFilterQuery={handleFilterQuery}
                options={sortOptions}
              />
              <FilterBy
                handleFilterQuery={handleFilterQuery}
                options={filterOptions}
              />
            </div>
            <div>
              <Search handleFilterQuery={handleFilterQuery} />
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="flex-grow overflow-auto p-2 md:px-4">
        <Table
          headers={headers}
          data={ingredients}
          page="ingredients"
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
          onRowClick = {viewImageFunction}
        />
      </div>

      {/* Pagination */}
      {ingredients && ingredients?.length > 0 && (
        <Pagination
          paginationInfo={paginationInfo}
          onPageChange={handlePageChange}
        />
      )}

      {/* Modals */}
      <AddIngredientModal
        ingredients={ingredients}
        user_id={user?._id}
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onResult={handleCreateResult}
      />
      <EditIngredientModal
        ingredients={ingredients}
        user_id={user?._id}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        ingredient={selectedIngredient}
        onResult={handleEditResult}
      />
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Ingredient"
        description={`Are you sure you want to delete ${selectedIngredient?.name}? This action cannot be undone.`}
        type="delete"
      />
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSubmit={handleImportSubmit}
      />

      <ImagePreviewModal
        isOpen={viewImageModal}
        onClose={() => setViewImageModal(false)}
        imageUrl={currentImageURL}
        name={nameImage}
        description={currentDescription}
      />

      {/*  Toasts */}
      <Toast
        className="transition delay-150 ease-in-out"
        show={showToast}
        action={toastAction}
        message={message}
        onHide={hideToast}
      />
    </div>
  )
}

export default Ingredients
