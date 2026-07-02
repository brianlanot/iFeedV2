import { useEffect, useState, React } from 'react';
import { RiCloseLine, RiArrowRightSLine, RiLayoutGridLine, RiTableLine, RiRobotLine } from 'react-icons/ri';
import Info from '../icons/Info.jsx';

const OptimizationResultsModal = ({ 
  isOpen, 
  onClose, 
  results, 
  onGenerateReport,
  formulation,
  goToPercent,
  ispercentcompute
}) => {
  const [detailedIngredients, setDetailedIngredients] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false); // New state for AI
  const [viewMode, setViewMode] = useState('simple'); 
  const [aiData, setAiData] = useState('');
  
  // --- MOVED HELPER FUNCTIONS UP ---
  // These need to be declared before the useEffect so they can be used to generate the AI prompt
  const formatNum = (val, decimals = 2) => Number(val || 0).toFixed(decimals);

  const getAchievedTotal = (nutrientList, targetName, totalweight) => {
    if (!nutrientList || !Array.isArray(nutrientList)) return 0;
    const n = nutrientList.find(nut => nut.name?.toLowerCase().includes(targetName.toLowerCase()));

    if (ispercentcompute){
      return n ? Number(n.value|| 0) : 0;
    }
    return n ? Number(n.value || 0) : 0;
  };

  const getExpectedTarget = (nutrientList, targetName) => {
    if (!nutrientList || !Array.isArray(nutrientList)) return 0;
    const n = nutrientList.find(nut => nut.name?.toLowerCase().includes(targetName.toLowerCase()));
    return n ? (Number(n.minimum || 0) + Number(n.maximum || 0)) / 2 : 0;
  };
  // ---------------------------------
  
  useEffect(() => {

    if (!isOpen || !results) return;

    const fetchIngredientDetails = async () => {
      if (!isOpen || !results?.ingredients) return;
      
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
        console.log("DETAILED INGREDIENTS", detailedIngredients)
        setIsLoading(false);
      }
    };

    fetchIngredientDetails();

  }, [isOpen, results, formulation]);

  useEffect(() => {
    const fetchAIAnswer = async () => {
      if (!isOpen || !results) return;
      setIsAiLoading(true);
      try {
        // Create a readable summary for the AI (Ingredients)
        const ingredientSummary = results.ingredients
          .map(ing => `${ing.name}: ${ing.value}${ispercentcompute ? '%' : 'g'}`)
          .join(', ');

        // Create a readable summary for the AI (Nutrients Achieved vs Expected)
        const nutrientSummary = formulation?.nutrients
          ?.map(nut => {
            const achieved = formatNum(getAchievedTotal(results.nutrients, nut.name, results.totalWeight), 2);
            const expected = formatNum(getExpectedTarget(formulation.nutrients, nut.name), 2);
            return `${nut.name}: Achieved ${achieved}, Expected Range - ${expected*0.8}-${expected*1.2}`;
          }).join('; ') || 'None';

        // Extract Formulation Details conditionally
        const animalGroup = formulation?.animal_group ? `Animal Group: ${formulation.animal_group}.` : '';
        const desc = formulation?.description ? `Description: ${formulation.description}.` : '';
        const pregnant = formulation?.pregnant_phase ? `Pregnant Phase: ${formulation.pregnant_phase}.` : '';
        const lactating = formulation?.lactating_phase ? `Lactating Phase: ${formulation.lactating_phase}.` : '';

        // Construct the final comprehensive prompt
        const promptString = `Analyze this feed formulation. ${animalGroup} ${desc} ${pregnant} ${lactating} Ingredients: ${ingredientSummary}. Total Weight: ${results.totalWeight}kg. Nutrients Breakdown: ${nutrientSummary}. 
        Is this balanced? Tell me if the ingredient mix is good. Provide a short 3-sentence expert summary with both positive and negative aspects. Use normal typings. remove emojis, and also bold italic or any other text styles`.trim().replace(/\s+/g, ' ');

        const response = await fetch(`${import.meta.env.VITE_API_URL}/gemini`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            question: promptString 
          })
        });

        const data = await response.json();
        setAiData(data.answer);
      } catch (error) {
        console.error("AI Fetch Error:", error);
        setAiData("Could not load AI insights at this time.");
      } finally {
        setIsAiLoading(false);
      }
    };
    fetchAIAnswer();
  }, [isOpen, results, formulation, ispercentcompute]);

  if (!isOpen || !results) return null;

  /**
   * Logic: (Weight * DM%) * Nutrient%
   * Last element is always treated as the multiplier for others
   */
/**
 * Corrected version - works for BOTH percent and gram mode
 */
const getIngredientContribution = (ingredientId, weightValue, nutrientTargetId, ingredientData, unit = 'grams', totalWeightKg) => {
  if (!ingredientData || !ingredientData.nutrients) return 0;

  const lastNutrient = formulation.nutrients[formulation.nutrients.length - 1];
  const dmTargetId = lastNutrient?._id || lastNutrient?.id || lastNutrient?.nutrient_id;

  const currentNutrientEntry = ingredientData.nutrients.find(n => n.nutrient === nutrientTargetId);
  const dmEntry = ingredientData.nutrients.find(n => n.nutrient === dmTargetId);

  if (!currentNutrientEntry) return 0;

  const dmDecimal = Number(dmEntry?.value || 0.90);

  // Get total Dry Matter from backend (already correct in both modes)
  const dmTargetGrams = getAchievedTotal(results.nutrients, "Dry Matter", totalWeightKg);
  const dmTargetKg = dmTargetGrams / 1000;

  let asFedKg = 0;

  if (ispercentcompute) {
    // percent mode: weightValue = % of DM
    const percentOfDM = Number(weightValue);
    const dmKgOfIngredient = (percentOfDM / 100) * dmTargetKg;
    asFedKg = dmKgOfIngredient / dmDecimal;
  } else {
    // gram mode: weightValue = grams as-fed
    asFedKg = Number(weightValue) / 1000;
  }

  if (nutrientTargetId === dmTargetId) {
    return asFedKg * dmDecimal * 1000; // return grams of DM
  }

  // Normal nutrient
  const nutrientFraction = Number(currentNutrientEntry.value || 0);
  const nutrientGrams = asFedKg * dmDecimal * nutrientFraction * 1000;

  return nutrientGrams;
};
  // --- ADDED SORTING LOGIC HERE ---
  // Create a new sorted array descending by value
  const sortedIngredients = [...results.ingredients].sort((a, b) => Number(b.value) - Number(a.value));
  // --------------------------------

  return (
    <dialog className={`modal ${isOpen ? 'modal-open' : ''} z-[999] `}>
      <div className="modal-box relative w-11/12 max-w-4xl rounded-3xl bg-white md:mt-0 shadow-2xl p-5 md:p-6 no-scrollbar">
        <button className="btn btn-sm btn-circle absolute top-4 right-4 z-10" onClick={onClose}>
          <RiCloseLine className="h-5 w-5" />
        </button>

        <h3 className="text-deepbrown mb-1 text-lg font-bold">Feed Formulation</h3>

        {/* STEP PROGRESS BAR */}
        <div className="flex flex-row items-center space-x-2 md:space-x-4 mb-6 overflow-x-auto no-scrollbar pb-1 text-deepbrown">
          <div className="flex items-center gap-2 shrink-0 opacity-60">
            <h1 className="text-gray-400 text-[10px] md:text-sm font-bold uppercase tracking-wider">Select/Create</h1>
            <RiArrowRightSLine className="text-gray-300 h-4 w-4 md:h-5 md:w-5" />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex flex-col items-start md:items-center">
              <h1 className="text-deepbrown text-[10px] md:text-sm font-bold uppercase tracking-wider">Formulate</h1>
              <div className="h-1 w-full bg-deepbrown rounded-full mt-0.5 animate-pulse" />
            </div>
            <RiArrowRightSLine className="text-deepbrown h-4 w-4 md:h-5 md:w-5" />
          </div>
          <div className="flex items-center gap-2 shrink-0 opacity-60 text-gray-400 text-[10px] md:text-sm font-bold uppercase tracking-wider">Generate</div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-gray-50 border border-gray-100 p-3 md:p-4 rounded-2xl">
            <span className="text-[9px] md:text-[10px] uppercase font-bold text-gray-400 tracking-widest block mb-1">Total Weight</span>
            <p className="text-lg md:text-2xl font-bold text-deepbrown leading-none">
              {formatNum(results.totalWeight)} <span className="text-xs font-normal">kg</span>
            </p>
          </div>
          <div className="bg-green-50 border border-green-100 p-3 md:p-4 rounded-2xl">
            <span className="text-[9px] md:text-[10px] uppercase font-bold text-green-600 tracking-widest block mb-1">Calculated Cost</span>
            <p className="text-lg md:text-2xl font-bold text-green-700 leading-none">₱{formatNum(results.totalCost)}</p>
          </div>
        </div>

        {/* VIEW TOGGLE */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-4">
          <div className="flex items-center gap-2 text-xs text-gray-500 italic">
            <Info className="shrink-0" />
            <span>{isLoading ? 'Loading data...' : 'Optimization complete (Ingredients with no value is removed).'}</span>
          </div>
          <div className="flex bg-gray-100 p-1 rounded-xl overflow-x-auto no-scrollbar">
            <button 
              onClick={() => setViewMode('simple')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap ${viewMode === 'simple' ? 'bg-white shadow-sm text-deepbrown' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <RiLayoutGridLine /> BREAKDOWN
            </button>
            <button 
              onClick={() => setViewMode('detailed')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap ${viewMode === 'detailed' ? 'bg-white shadow-sm text-deepbrown' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <RiTableLine /> NUTRIENTS
            </button>
            <button 
              onClick={() => setViewMode('ai')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap ${viewMode === 'ai' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <RiRobotLine /> AI INSIGHT
            </button>
          </div>
        </div>

        <div className="mb-6">
          <div className="max-h-64 overflow-auto rounded-2xl border border-gray-100 shadow-sm no-scrollbar bg-gray-50">
            
            {viewMode === 'simple' && (
              /* --- VERSION 1: SIMPLE INGREDIENT LIST --- */
              <table className="table table-xs md:table-sm w-full bg-white">
                <thead className="sticky top-0 bg-gray-50 text-gray-500 z-10">
                  <tr className="uppercase text-[10px]">
                    <th className="py-3 px-4 text-left">Ingredient Name</th>
                    <th className="text-right py-3 px-4">{ispercentcompute ? '% of Total Feed' : 'Amount (KG AS-FED)'}</th>
                  </tr>
                </thead>
                <tbody className="text-[11px] md:text-sm">
                  {/* --- CHANGED TO sortedIngredients --- */}
                  {sortedIngredients.map((ing, idx) => (
                    <tr key={idx} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                      <td className="py-3 px-4 text-gray-700 font-medium">{ing.name}</td>
                      <td className="text-right py-3 px-4 font-mono font-bold text-deepbrown">
                        {ispercentcompute ? formatNum(Number(ing.value)) + "%" : formatNum(Number(ing.value) / 1000, 3) + " kg"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {viewMode === 'detailed' && (
              /* --- VERSION 2: DETAILED NUTRIENT TABLE --- */
              <table className="table table-xs md:table-sm w-full text-center bg-white">
                <thead className="sticky top-0 bg-gray-50 text-gray-500 z-10 border-b">
                  <tr className="uppercase text-[9px] md:text-[10px]">
                    <th className="text-left py-3 px-4 sticky left-0 bg-gray-50 z-20 shadow-sm">Ingredient</th>

                    {ispercentcompute ? 
                    
                    <><th>% total feed ratio</th>
                    <th>kg/animal per day</th></>: 
                    
                    <><th>kg/animal per day</th>
                    <th>% total feed ratio</th></>}
                    
                    {formulation.nutrients.find(nut => nut.name === "Dry Matter") && (
                      <th>Dry Matter (kg)</th>
                    )}
                    {formulation.nutrients.map((nut, i) => (
                      nut.name !== "Dry Matter" && (
                        nut.name === "Total Digestible Nutrients" ?
                        <th key={i}>{nut.name} (kg)</th> :
                        <th key={i}>{nut.name} (g)</th>
                      )
                    ))}
                    
                  </tr>
                </thead>
                <tbody className="text-[11px] md:text-sm">
                  {/* --- CHANGED TO sortedIngredients --- */}
                  {sortedIngredients.filter(ing => ing.value !== 0).map((ing, idx) => {
                    const ingredientData = detailedIngredients.find(
                      (item) => ((item._id === ing.ingredient_id) || (item.name === ing.name))
                    );
                    
                    console.log("TOTAL WEIGHT", results.totalWeight)
                    return (
                      <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="py-2 px-4 text-left text-gray-700 font-medium sticky left-0 bg-white z-10 border-r">
                          {ing.name}
                        </td>
                        <td className="font-mono font-bold text-deepbrown">
                          {ispercentcompute ? formatNum(ing.value, 2) + " %" : formatNum(ing.value / 1000,2) + " kg"}
                          
                        </td>
                        <td className="text-gray-500 font-mono">
                          {ispercentcompute ? formatNum(((ing.value/100) * (results.totalWeight /100)) * 100, 2) : formatNum(ing.value/results.totalWeight/10, 2) + " %" }
                          
                        </td>
                        {formulation.nutrients.find(nut => nut.name === "Dry Matter") && (
                          <td className="text-gray-500 font-mono">
                            {formatNum(getIngredientContribution(
                              ingredientData?._id, 
                              ing.value, 
                              formulation.nutrients.find(n => n.name === "Dry Matter")?.nutrient_id || formulation.nutrients.find(n => n.name === "Dry Matter")?._id, 
                              ingredientData,
                              "kilograms",
                              results.totalWeight
                            ) / 1000, 2)} kg
                          </td>
                        )}
                        {formulation.nutrients.map((nut) => 
                          nut.name !== "Dry Matter" && (
                            nut.name === "Total Digestible Nutrients" ?
                            <td key={nut._id} className="text-gray-500 font-mono">
                              {formatNum(getIngredientContribution(
                                ingredientData?._id, 
                                ing.value, 
                                nut.nutrient_id || nut._id, 
                                ingredientData,
                                "kilograms",
                                results.totalWeight
                              ) / 1000, 2)} kg
                            </td> :
                            <td key={nut._id} className="text-gray-500 font-mono">
                              {formatNum(getIngredientContribution(
                                ingredientData?._id, 
                                ing.value, 
                                nut.nutrient_id || nut._id, 
                                ingredientData,
                                "grams",
                                results.totalWeight
                              ), 2)} g
                            </td>
                          )
                        )}
                      </tr>
                    );
                  })}
                  <tr className="bg-amber-50 font-bold border-t-2 border-amber-100">
                    <td className="sticky left-0 bg-amber-50 z-10 text-left px-4">TOTAL</td>
                    <td className="font-mono text-amber-700">
                      
                      {ispercentcompute ? "100 %" : (results.totalWeight) + "kg"}
                      
                    </td>
                    <td className="text-gray-500 font-mono">

                      {ispercentcompute ? (results.totalWeight) + "kg": "100 %"}
                    </td>
                    {formulation.nutrients.find(nut => nut.name === "Dry Matter") && (
                      <td className="font-mono text-amber-700">{formatNum(getAchievedTotal(results.nutrients, "Dry Matter", results.totalWeight) / 1000, 2)} kg</td>
                    )}
                    {formulation.nutrients.map((nut, i) =>
                      nut.name !== "Dry Matter" && (
                        nut.name === "Total Digestible Nutrients" ?
                        <td key={i} className="font-mono text-amber-700">{formatNum(getAchievedTotal(results.nutrients, nut.name, results.totalWeight) / 1000, 2)} kg</td> :
                        <td key={i} className="font-mono text-amber-700">{formatNum(getAchievedTotal(results.nutrients, nut.name, results.totalWeight), 2)} g</td>
                      )
                    )}
                  </tr>
                  <tr className="bg-amber-500 font-bold text-white">
                    <td className="sticky left-0 bg-amber-500 z-10 text-left px-4">REQ.</td>
                    <td className="font-mono">
                      {ispercentcompute ? "100 %" : (results.totalWeight) + "kg"}
                    </td>
                    <td className="text-white font-mono">

                      {ispercentcompute ? (results.totalWeight) + "kg": "100 %"}
                    </td>
                    {formulation.nutrients.find(nut => nut.name === "Dry Matter") && (
                      <td className="font-mono">{formatNum(getExpectedTarget(formulation.nutrients, "Dry Matter") / 1000, 2)} kg</td>
                    )}
                    {formulation.nutrients.map((nut, i) =>
                      nut.name !== "Dry Matter" && (
                        nut.name === "Total Digestible Nutrients" ?
                        <td key={i} className="font-mono">{formatNum(getExpectedTarget(formulation.nutrients, nut.name) / 1000, 2)} kg</td> :
                        <td key={i} className="font-mono">{formatNum(getExpectedTarget(formulation.nutrients, nut.name), 2)} g</td>
                      )
                    )}
                  </tr>
                </tbody>
              </table>
            )}

            {viewMode === 'ai' && (
              /* --- VERSION 3: AI INSIGHTS --- */
              <div className="bg-blue-50 h-full min-h-[12rem] p-5">
                <div className="flex items-center gap-2 mb-3">
                  <RiRobotLine className="text-blue-600 h-6 w-6" />
                  <span className="text-sm font-bold text-blue-700 uppercase tracking-wider">AI Nutritionist Insight</span>
                </div>
                {isAiLoading ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-8">
                    <span className="loading loading-spinner loading-md text-blue-500"></span>
                    <p className="text-sm text-blue-500 font-medium animate-pulse">Analyzing formulation...</p>
                  </div>
                ) : (
                  <p className="text-[13px] md:text-sm text-blue-900 leading-relaxed font-medium">
                    {aiData || "No insights available for this formulation."}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col-reverse md:flex-row gap-2 md:justify-end mt-4">
          <button className="btn btn-ghost md:btn-outline rounded-xl px-8 border-gray-200 text-gray-500 h-10 min-h-0" onClick={onClose}>
            Back to Editor
          </button>
          <button className="btn bg-green-button hover:bg-green-600 rounded-xl px-8 text-white flex gap-2 items-center justify-center h-10 min-h-0 border-none shadow-lg" onClick={onGenerateReport}>
            Generate PDF Report <RiArrowRightSLine className="hidden md:block" />
          </button>
          <button className="btn bg-white hover:border-green hover:text-green-600 rounded-xl px-8 text-black flex gap-2 items-center justify-center h-10 min-h-0  shadow-lg" onClick={goToPercent}>
            Switch to Percent Mode <RiArrowRightSLine className="hidden md:block" />
          </button>
        </div>
      </div>
    </dialog>
  );
};

export default OptimizationResultsModal;