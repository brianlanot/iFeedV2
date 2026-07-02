import { useEffect, useState, React } from 'react';
import { RiArrowRightSLine } from 'react-icons/ri';
import Info from '../icons/Info.jsx';

const OptimizationResultsBox = ({ 
  results, 
  onGenerateReport,
  formulation
}) => {
  const [detailedIngredients, setDetailedIngredients] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchIngredientDetails = async () => {
      if (!results?.ingredients) return;
      
      setIsLoading(true);
      try {
        const ids = formulation.ingredients.map(ing => ing.ingredient_id || ing._id);
        
        const response = await fetch(`${import.meta.env.VITE_API_URL}/ingredient/idarray`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids })
        });

        const data = await response.json();
        if (data.message === 'success') {
          setDetailedIngredients(data.ingredients);
        }
      } catch (error) {
        console.error("Error fetching ingredient details:", error);
      } finally {
        console.log(detailedIngredients, "DETAILED INGREDIENTS")
        setIsLoading(false);
      }
    };

    fetchIngredientDetails();
  }, [results, formulation]);

  if (!results) return null;

  const formatNum = (val, decimals = 2) => Number(val || 0).toFixed(decimals);

  const getIngredientContribution = (ingredientId, weightInGrams, nutrientTargetId, unit) => {
    const ingredientData = detailedIngredients.find(item => item._id === ingredientId);

    if (!ingredientData || !ingredientData.nutrients) return 0;

    const lastNutrient = formulation.nutrients[formulation.nutrients.length - 1];
    const dmTargetId = lastNutrient.nutrient_id || lastNutrient._id;

    const currentNutrientEntry = ingredientData.nutrients.find(n => n.nutrient === nutrientTargetId);
    const dmEntry = ingredientData.nutrients.find(n => {

      console.log(n.nutrient, dmTargetId, "CHECK DM TARGET ID")
      return n.nutrient === dmTargetId;
    });

    if (!currentNutrientEntry) return 0;

    const weightKg = Number(weightInGrams) / 1000;
    const dmPercentage = Number(dmEntry?.value || 0);
    const dryMatterKg = weightKg * dmPercentage;

    if (nutrientTargetId === dmTargetId) {

      return dryMatterKg * 1000; 
    }
      
    if (unit === "grams"){
      return dryMatterKg * Number(currentNutrientEntry.value || 0) * 1000 *1000;
    }
    return dryMatterKg * Number(currentNutrientEntry.value || 0)*1000;
  };

  const calculateTotalAchievedForNutrient = (nutrientId, unit) => {
    

    return results.ingredients.reduce((total, ing) => {
      const ingredientId = ing.ingredient_id || ing._id;
      return total + getIngredientContribution(ingredientId, ing.value, nutrientId, unit);
    }, 0);
  };

  const getExpectedTarget = (nutrientList, targetName, unit) => {
    if (!nutrientList || !Array.isArray(nutrientList)) return 0;
    const n = nutrientList.find(nut => nut.name?.toLowerCase().includes(targetName.toLowerCase()));

    if (unit === "grams") {
      return n ? (Number(n.minimum || 0) + Number(n.maximum || 0)) / 2 : 0;
    } else {
      return n ? (Number(n.minimum || 0) + Number(n.maximum || 0)) / 2 / 1000 : 0;
    }
    
  };

  return (
    <div className="flex flex-col h-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="p-4 border-b border-gray-100 bg-gray-50/30">
        <h3 className="text-sm font-bold text-deepbrown">Optimization Resultss</h3>
        <div className="flex items-center gap-2 text-[10px] text-gray-500 italic mt-1">
          <Info size={12} />
          <span>{isLoading ? 'Syncing matrix...' : 'Nutrient matrix synchronized.'}</span>
        </div>
      </div>

      <div className="p-4 flex-1 overflow-auto no-scrollbar">
        {/* Summary Mini-Cards */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-gray-50 border border-gray-100 p-2 rounded-lg">
            <span className="text-[8px] uppercase font-bold text-gray-400 tracking-widest block">Total Weight</span>
            <p className="text-md font-bold text-deepbrown">{formatNum(results.totalWeight, 2)}kg</p>
          </div>
          <div className="bg-green-50 border border-green-100 p-2 rounded-lg">
            <span className="text-[8px] uppercase font-bold text-green-600 tracking-widest block">Cost</span>
            <p className="text-md font-bold text-green-700">₱{formatNum(results.totalCost)}</p>
          </div>
        </div>

        {/* Nutrient Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-100">
          <table className="table table-xs w-full text-center border-separate border-spacing-0">
            <thead className="bg-gray-50 text-gray-500">
              <tr className="uppercase text-[9px]">
                <th className="text-left py-2 px-2 sticky left-0 bg-gray-50 border-r border-b">Ingredient</th>
                <th className="border-b">kg/animal per day</th>
                {formulation.nutrients.find(nut => nut.name === "Dry Matter") && (
                  <th className="border-b">Dry Matter (kg)</th>
                )}
                {formulation.nutrients.map((nut, i) => (
                  nut.name !== "Dry Matter" && (
                    nut.name === "Total Digestible Nutrients" ?
                    <th key={i} className="border-b">{nut.name} (kg)</th> :
                    <th key={i} className="border-b">{nut.name} (g)</th>
                  )
                ))}
              </tr>
            </thead>
            <tbody className="text-[10px]">
              {results.ingredients.map((ing, idx) => {
                const ingredientId = ing.ingredient_id || ing._id;
                return (
                  <tr key={idx} className="hover:bg-gray-50/50">
                    <td className="py-2 px-2 text-left text-gray-700 font-bold sticky left-0 bg-white border-r border-b">
                      {ing.name}
                    </td>
                    <td className="font-mono text-deepbrown border-b">
                      {formatNum(ing.value, 2)}kg
                    </td>
                    {formulation.nutrients.find(nut => nut.name === "Dry Matter") && (
                      <td className="text-gray-500 font-mono border-b">
                        {formatNum(getIngredientContribution(ingredientId, ing.value, formulation.nutrients.find(n => n.name === "Dry Matter")?.nutrient_id || formulation.nutrients.find(n => n.name === "Dry Matter")?._id, "kilograms"), 2)}kg
                      </td>
                    )}
                    {formulation.nutrients.map((nut) => (
                      nut.name !== "Dry Matter" && (
                        nut.name === "Total Digestible Nutrients" ?
                        <td key={nut._id} className="text-gray-500 font-mono border-b">
                          {formatNum(getIngredientContribution(ingredientId, ing.value, nut.nutrient_id || nut._id, "kilograms"), 2)}kg
                        </td> :
                        <td key={nut._id} className="text-gray-500 font-mono border-b">
                          {formatNum(getIngredientContribution(ingredientId, ing.value, nut.nutrient_id || nut._id, "grams"), 2)}g
                        </td>
                      )
                    ))}
                  </tr>
                );
              })}

              {/* Totals Achieved Row */}
              <tr className="bg-amber-50 font-bold text-deepbrown">
                <td className="sticky left-0 bg-amber-50 text-left px-2 border-r border-t border-amber-100">TOTAL</td>
                <td className="font-mono border-t border-amber-100">
                  {formatNum(results.ingredients.reduce((s, i) => s + Number(i.value || 0), 0), 2)}kg
                </td>
                {formulation.nutrients.find(nut => nut.name === "Dry Matter") && (
                  <td className="font-mono border-t border-amber-100">
                    {formatNum(calculateTotalAchievedForNutrient(formulation.nutrients.find(n => n.name === "Dry Matter")?.nutrient_id || formulation.nutrients.find(n => n.name === "Dry Matter")?._id, "kilograms"), 2)}kg
                  </td>
                )}
                {formulation.nutrients.map((nut, i) => (
                  nut.name !== "Dry Matter" && (
                    nut.name === "Total Digestible Nutrients" ?
                    <td key={i} className="font-mono border-t border-amber-100">
                      {formatNum(calculateTotalAchievedForNutrient(nut.nutrient_id || nut._id, "kilograms"), 2)}kg
                    </td> :
                    <td key={i} className="font-mono border-t border-amber-100">
                      {formatNum(calculateTotalAchievedForNutrient(nut.nutrient_id || nut._id, "grams"), 2)}g
                    </td>
                  )
                ))}
              </tr>

              {/* Expected Requirements Row */}
              <tr className="bg-amber-500 font-bold text-white">
                <td className="sticky left-0 bg-amber-500 text-left px-2 border-r">REQ.</td>
                <td className="font-mono">{formatNum(results.totalWeight, 2)}kg</td>
                {formulation.nutrients.find(nut => nut.name === "Dry Matter") && (
                  <td className="font-mono">
                    {formatNum(getExpectedTarget(formulation.nutrients, "Dry Matter", "kilograms"), 2)}kg
                  </td>
                )}
                {formulation.nutrients.map((nut, i) => (
                  nut.name !== "Dry Matter" && (
                    nut.name === "Total Digestible Nutrients" ?
                    <td key={i} className="font-mono">{formatNum(getExpectedTarget(formulation.nutrients, nut.name, "kilograms"), 2)}kg</td> :
                    <td key={i} className="font-mono">{formatNum(getExpectedTarget(formulation.nutrients, nut.name, "grams"), 2)}g</td>
                  )
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OptimizationResultsBox;