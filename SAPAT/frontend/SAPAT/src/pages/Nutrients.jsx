import { useState, useEffect } from 'react'
import { RiAddLine } from 'react-icons/ri'
import AddNutrientModal from '../components/modals/nutrients/AddNutrientModal'
import EditNutrientModal from '../components/modals/nutrients/EditNutrientModal'
import ConfirmationModal from '../components/modals/ConfirmationModal'
import Table from '../components/Table'
import Loading from '../components/Loading.jsx'
import useAuth from '../hook/useAuth.js'
import { Navigate } from 'react-router-dom'
import axios from 'axios'
import Toast from '../components/Toast.jsx'
import Search from '../components/Search.jsx'
import Pagination from '../components/Pagination.jsx'
import SortBy from '../components/SortBy.jsx'
import FilterBy from '../components/FilterBy.jsx'
import { useTranslation } from 'react-i18next'
function Nutrients() {
  const { t, i18n } = useTranslation();
  const { user, loading } = useAuth()
  const [nutrients, setNutrients] = useState([])
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedNutrient, setSelectedNutrient] = useState(null)
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

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user, searchQuery, sortBy, sortOrder, filters, page])

  const fetchData = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/nutrient/filtered/search/${user?._id}?searchQuery=${searchQuery}&filters=${filters}&sortBy=${sortBy}&sortOrder=${sortOrder}&skip=${(page - 1) * limit}&limit=${limit}`
      )
      const fetchedData = res.data
      setNutrients(fetchedData.fetched)
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

  const handleEditClick = (nutrient) => {
    setSelectedNutrient(nutrient)
    setIsEditModalOpen(true)
  }

  const handleDeleteClick = (nutrient) => {
    setSelectedNutrient(nutrient)
    setIsDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    try {
      const selectedId = selectedNutrient.nutrient_id || selectedNutrient._id
      const res = await axios.delete(
        `${import.meta.env.VITE_API_URL}/nutrient/${selectedId}/${user?._id}`
      )
      const messageData = res.data.message
      if (messageData === 'success') {
        const filteredNutrients = nutrients.filter(
          (nutrient) => nutrient.nutrient_id !== selectedId && nutrient._id !== selectedId
        )
        setNutrients(filteredNutrients)
        if (filteredNutrients.length === 0) {
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
          ? t('Nutrient deleted successfully')
          : t('Failed to delete nutrient.')
      )
      setToastAction(messageData)
    } catch (err) {
      console.log(err)
      setShowToast(true)
      setMessage(t('Failed to delete nutrient.'))
      setToastAction('error')
    }
  }

  const handleCreateResult = (newNutrient, action, message) => {
    setIsAddModalOpen(false)
    setNutrients([newNutrient, ...nutrients])
    // toast instructions
    setShowToast(true)
    setMessage(message)
    setToastAction(action)
  }

  const handleEditResult = (updatedNutrient, action, message) => {
    setIsEditModalOpen(false)
    setNutrients((prevNutrient) => {
      const index = prevNutrient.findIndex(
        (nutrient) => nutrient._id === updatedNutrient._id || nutrient._id === updatedNutrient.nutrient_id
      )
      const updated = [...prevNutrient]
      updated[index] = { ...updatedNutrient }
      return updated
    })
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

  const headers = ['Abbreviation', 'Name', 'Unit', 'Description', 'Group']
  const filterOptions = [
    { value: 'Energy', label: 'Energy' },
    { value: 'Composition', label: 'Composition' },
    { value: 'Minerals', label: 'Minerals' },
    { value: 'Amino acids', label: 'Amino acids' },
  ]
  const sortOptions = [
    { value: 'na-default', label: 'Default' },
    { value: 'name-asc', label: 'Name (A-Z)' },
    { value: 'name-desc', label: 'Name (Z-A)' },
    { value: 'group-asc', label: 'Group (A-Z)' },
    { value: 'group-desc', label: 'Group (Z-A)' },
  ]

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
      <div className="sticky top-0 z-10 space-y-6 bg-gray-50 p-2 md:p-4">
        <h1 className="text-deepbrown mb-3 text-xl font-bold md:text-2xl">
          Nutrients
        </h1>

        {/* Action buttons and search */}
        <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
          {/* Nutrients Limited to the first 5 nutrients first */}
          {/* <div className="flex w-full flex-wrap gap-2 md:w-auto">
            
              
              {user?.userType === 'admin' && (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="bg-green-button flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-sm text-white transition-colors hover:bg-green-600 active:bg-green-700 md:gap-2 md:px-3 md:py-1.5 md:text-base"
                >
                  <RiAddLine className="h-4 w-4 md:h-5 md:w-5" />
                  <span>{t('Add New')}</span>
                </button>
              )}

          </div> */}
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
          data={nutrients}
          page="nutrients"
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
        />
      </div>

      {/* Pagination */}
      {nutrients && nutrients.length > 0 && (
        <Pagination
          paginationInfo={paginationInfo}
          onPageChange={handlePageChange}
        />
      )}

      {/* Modals */}
      <AddNutrientModal
        nutrients={nutrients}
        user_id={user?._id}
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onResult={handleCreateResult}
      />
      <EditNutrientModal
        nutrients={nutrients}
        user_id={user?._id}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        nutrient={selectedNutrient}
        onResult={handleEditResult}
      />
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Nutrient"
        description={`Are you sure you want to delete ${selectedNutrient?.name}? This action cannot be undone.`}
        type="delete"
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

export default Nutrients
