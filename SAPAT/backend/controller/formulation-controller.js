import Formulation from '../models/formulation-model.js';
import SpecialFormulation from '../models/special-formulation-model.js';
import Ingredient from '../models/ingredient-model.js';
import Nutrient from '../models/nutrient-model.js';
import GroupFormulation from '../models/group-formulation.js';
import User from '../models/user-model.js';
import Cow from "../models/cow_nutrient_constraint.js";
import RegularBuffalo from "../models/regularbuffalo_nutrient_constraint.js";
import Bull from "../models/bull_nutrient_constraint.js";
import mongoose from 'mongoose';

const createFormulation = async (req, res) => {
    const {
        code, name, description, animal_group, body_weight, ownerId, ownerName, 
        nutrients, dmintake, milkyield, fat_protein_content, is_lactating, months_pregnant, avgGain
    } = req.body;
    try {
        const owner = await User.findById(ownerId);
        const isTemplate = owner && owner.userType === 'admin';
        const newFormulation = await Formulation.create({
            code, name, description, animal_group, 
            collaborators: [{ userId: ownerId, access: 'owner', displayName: ownerName }],
            isTemplate, nutrients, weight:' ', dmintake:parseFloat(dmintake),
            weightProgress: [parseInt(body_weight)], milkYieldProgress: [milkyield], 
            typeProgress: [animal_group], dateProgress: [new Date()], body_weight:parseInt(body_weight),
            fat_content:fat_protein_content, lactating_phase: is_lactating, pregnant_phase: months_pregnant, origNutrientTargets: nutrients, avgGain
        });

        const filteredFormulation = {
            "_id": newFormulation._id,
            "code": code,
            "name": name,
            "description": description ? description : "",
            "animal_group": animal_group ? animal_group : "",
            "isTemplate": isTemplate,
            "nutrients": nutrients,
            "weight": ' ',
            "body_weight": parseInt(body_weight),
            "dmintake": dmintake,
            "weightProgress": [parseInt(body_weight)],
            "milkYieldProgress": [milkyield],
            "typeProgress": [animal_group],
            "dateProgress": [new Date()],
            "fat_content": fat_protein_content ? fat_protein_content: '',
            "lactating_phase": is_lactating ? is_lactating: '',
            "pregnant_phase": months_pregnant ? months_pregnant: '',
            "origNutrientTargets": nutrients,
            "avgGain": avgGain ? avgGain : ''
        }

        await upsertGroupFormulation(newFormulation);
        res.status(200).json({ message: 'success', formulations: filteredFormulation });
        
    } catch (err) {
        res.status(500).json({ error: err.message, message: 'error' })
        console.log("Error creating formulation:", err);
    }
};

const getCowFormulation = async (req, res) => {
    const weight = Number(req.query.weight);
    try {
        const cowFormulation = await Cow.findOne({ weight }).populate('nutrientrequirement.nutrientid');
        if (!cowFormulation) {
            return res.status(404).json({ message: 'Cow formulation not found' });
        }
        res.status(200).json({ message: 'success', formulation: cowFormulation });
    } catch (err) {
        res.status(500).json({ error: err.message, message: 'error' });
    }
};

const getCarabaoFormulation = async (req, res) => {
    // Extract both weight and ADG from the query parameters
    const weight = Number(req.query.weight);
    const adg = Number(req.query.adg);
    const lactating = req.query.lactating === 'true' ? true : false; // Convert lactating to boolean
    try {
        let carabaoFormulation = null;

        if (lactating){
            carabaoFormulation = await RegularBuffalo.findOne({ 
                weight: weight, 
                gain: adg,
            }).populate('nutrientrequirement.nutrientid');
        } else {
            carabaoFormulation = await RegularBuffalo.findOne({ 
                weight: weight, 
                gain: adg 
            }).populate('nutrientrequirement.nutrientid');
        }
        
        if (!carabaoFormulation) {
            return res.status(404).json({ 
                message: `No Carabao formulation found for Weight: ${weight}kg and ADG: ${adg}kg/day` 
            });
        }

        res.status(200).json({ 
            message: 'success', 
            formulation: carabaoFormulation 
        });
        
    } catch (err) {
        console.error("Error fetching carabao data:", err);
        res.status(500).json({ 
            error: err.message, 
            message: 'error' 
        });
    }
};

const getBullFormulation = async (req, res) => {
    // Extract both weight and ADG from the query parameters
    const weight = Number(req.query.weight);
    try {

        const carabaoFormulation = await Bull.findOne({ 
            weight: weight,
        }).populate('nutrientrequirement.nutrientid');
        
        if (!carabaoFormulation) {
            return res.status(404).json({ 
                message: `No Carabao formulation found for Weight: ${weight}kg` 
            });
        }

        res.status(200).json({ 
            message: 'success', 
            formulation: carabaoFormulation 
        });
        
    } catch (err) {
        console.error("Error fetching carabao data:", err);
        res.status(500).json({ 
            error: err.message, 
            message: 'error' 
        });
    }
};


const getAllFormulations = async (req, res) => {
    const { collaboratorId } = req.params;
    const { skip=0, limit=8 } = req.query;

    try {
        // only show formulations where the user is part of the collaborators
        const formulations = await Formulation.find({'collaborators.userId': collaboratorId}).select('code name description animal_group collaborators createdAt');
        // aside from the basic details, return the access level of the user
        const filteredFormulations = formulations.map(formulation => {
            const access = formulation.collaborators.find(c => c.userId.toString() === collaboratorId)?.access;
            return {
                "_id": formulation._id,
                "code": formulation.code,
                "name": formulation.name,
                "description": formulation.description ? formulation.description : "",
                "animal_group": formulation.animal_group ? formulation.animal_group : "",
                "weight": formulation.weight ? formulation.weight : 0,
                "ingredients": formulation.ingredients ? formulation.ingredients : [],
                "nutrients": formulation.nutrients ? formulation.nutrients : [],
                "access": access,
                "createdAt": formulation.createdAt,
                "lastUpdated": formulation.lastUpdated,
                "dmintake": formulation.dmintake ? formulation.dmintake : 0,
                "weightProgress": formulation.weightProgress ? formulation.weightProgress : [],
                "milkYieldProgress": formulation.milkYieldProgress ? formulation.milkYieldProgress : [],
                "typeProgress": formulation.typeProgress ? formulation.typeProgress : [],
                "dateProgress": formulation.dateProgress ? formulation.dateProgress : [],
                "body_weight": formulation.body_weight ? formulation.body_weight : 0,
                "fat_content": formulation.fat_content ? formulation.fat_content: '',
                "lactating_phase": formulation.lactating_phase ? formulation.lactating_phase: '',
                "pregnant_phase": formulation.pregnant_phase ? formulation.pregnant_phase: '',
                "avgGain": formulation.avgGain ? formulation.avgGain : ''
            }
        })

        // pagination
        const totalCount = filteredFormulations.length;
        const paginatedFormulations = filteredFormulations.slice(skip, skip + limit);

        res.status(200).json({
            message: 'success',
            formulations: paginatedFormulations,
            pagination: {
                totalSize: totalCount,
                totalPages: Math.ceil(totalCount / limit),
                pageSize: paginatedFormulations.length,
                page: Math.floor(skip / limit) + 1,
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message, message: 'error' })
    }
};

const getAllSpecialFormulations = async (req, res) => {
    const { animalgroup } = req.params;
    const { skip=0, limit=8 } = req.query;

    try {
        // console.log("SHOWING SPECIAL FORMULATIONS")
        // only show formulations where the user is part of the collaborators
        const formulations = await SpecialFormulation.find({'animal_group': animalgroup}).select('code name description animal_group collaborators createdAt ingredients nutrients');
        // aside from the basic details, return the access level of the user
        // const filteredFormulations = formulations.map(formulation => {
        //     const access = formulation.collaborators.find(c => c.userId.toString() === collaboratorId)?.access;
        //     return {
        //         "_id": formulation._id,
        //         "code": formulation.code,
        //         "name": formulation.name,
        //         "description": formulation.description ? formulation.description : "",
        //         "animal_group": formulation.animal_group ? formulation.animal_group : "",
        //         "access": access,
        //         "createdAt": formulation.createdAt
        //     }
        // })

        // pagination
        const totalCount = formulations.length;
        const paginatedFormulations = formulations.slice(skip, skip + limit);

        res.status(200).json({
            message: 'success',
            formulations: paginatedFormulations,
            pagination: {
                totalSize: totalCount,
                totalPages: Math.ceil(totalCount / limit),
                pageSize: paginatedFormulations.length,
                page: Math.floor(skip / limit) + 1,
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message, message: 'error' })
    }
};


const getFormulation = async (req, res) => {
    const { id } = req.params;
    try {
        const formulation = await Formulation.findById(id);
        if (!formulation) {
            return res.status(404).json({ message: 'Formulation not found' });
        }
        res.status(200).json({ message: 'success', formulations: formulation });
    } catch (err) {
        res.status(500).json({ error: err.message, message: 'error' })
    }
};

const getFormulationByFilters = async (req, res) => {
    const {
        searchQuery = '',
        skip = 0, limit = 10,
        sortBy, sortOrder,
        filterBy = 'animal_group', filters
    } = req.query;
    const { userId } = req.params;
    try {
        let formulations = await Formulation.find({'collaborators.userId': userId})
        if (!formulations) {
            return res.status(404).json({ message: 'No formulations', fetched: [] });
        }
        // partial matching
        formulations = formulations.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

        // Filter the results
        if (filters) {
            const filtersArr = filters.split(',')
            if (filterBy === 'group') {
                formulations = formulations.filter(item => {
                    return filtersArr.includes(item.group)
                })
            } else {
                formulations = formulations.filter(item => {
                    return filtersArr.includes(item.animal_group)
                })
            }
        }

        // Sort the results
        formulations.sort((a, b) => {
            if (sortBy === 'name') {
                if (sortOrder === 'asc') {
                    return a?.name?.toString().localeCompare(b?.name?.toString() || '');
                } else {
                    return b?.name?.toString().localeCompare(a?.name?.toString() || '');
                }
            } else if (sortBy === 'group') {
                if (sortOrder === 'asc') {
                    return a?.group?.toString().localeCompare(b?.group?.toString() || '');
                } else {
                    return b?.group?.toString().localeCompare(a?.group?.toString() || '');
                }
            } else if (sortBy === 'animal_group') {
                if (sortOrder === 'asc') {
                    return a?.animal_group?.toString().localeCompare(b?.animal_group?.toString() || '');
                } else {
                    return b?.animal_group?.toString().localeCompare(a?.animal_group?.toString() || '');
                }
            }
        });

        const formattedFormulations = formulations.map(formulation => {
            const access = formulation.collaborators.find(c => c.userId.toString() === userId)?.access;
            return {
                "_id": formulation._id,
                "code": formulation.code,
                "name": formulation.name,
                "description": formulation.description ? formulation.description : "",
                "weight": formulation.weight ? formulation.weight : 0,
                "ingredients": formulation.ingredients ? formulation.ingredients : [],
                "nutrients": formulation.nutrients ? formulation.nutrients : [],
                "animal_group": formulation.animal_group ? formulation.animal_group : "",
                "access": access,
                "createdAt": formulation.createdAt,
                "dmintake": formulation.dmintake ? formulation.dmintake : 0,
                "lastUpdated": formulation.lastUpdated,
                "weightProgress": formulation.weightProgress ? formulation.weightProgress : [],
                "milkYieldProgress": formulation.milkYieldProgress ? formulation.milkYieldProgress : [],
                "typeProgress": formulation.typeProgress ? formulation.typeProgress : [],
                "dateProgress": formulation.dateProgress ? formulation.dateProgress : [],
                "body_weight": formulation.body_weight ? formulation.body_weight : 0,
                "fat_content": formulation.fat_content ? formulation.fat_content: '',
                "lactating_phase": formulation.lactating_phase ? formulation.lactating_phase: '',
                "pregnant_phase": formulation.pregnant_phase ? formulation.pregnant_phase: '',
                "avgGain": formulation.avgGain ? formulation.avgGain : ''
            }
        })

        // pagination
        const totalCount = formattedFormulations.length;
        const paginatedFormulations = formattedFormulations.slice(skip, skip + limit);

        res.status(200).json({
            message: 'success',
            fetched: paginatedFormulations,
            pagination: {
                totalSize: totalCount,
                totalPages: Math.ceil(totalCount / limit),
                pageSize: paginatedFormulations.length,
                page: Math.floor(skip / limit) + 1,
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message, message: 'error' })
    }
}


// const updateFormulation = async (req, res) => {
//     const { id } = req.params;
//     let { code, name, description, animal_group, cost, weight, body_weight, ingredients, nutrients, nutrientRatioConstraints, weightProgress, milkYieldProgress, typeProgress, dateProgress, 
//         fat_protein_content, is_lactating, months_pregnant } = req.body;
    
//     // // Ensure both name and ID fields are preserved in nutrientRatioConstraints (fix for data persistence issue when using the solver)
//     nutrientRatioConstraints = (nutrientRatioConstraints || []).map(constraint => {
//       return {
//         firstIngredient: constraint.firstIngredient,
//         firstIngredientId: constraint.firstIngredientId,
//         secondIngredient: constraint.secondIngredient,
//         secondIngredientId: constraint.secondIngredientId,
//         operator: constraint.operator,
//         firstIngredientRatio: constraint.firstIngredientRatio,
//         secondIngredientRatio: constraint.secondIngredientRatio
//       }
//     });
//     try {
//         const formulation = await Formulation.findByIdAndUpdate(
//           id,
//           {
//               $set:
//                 {
//                     code, name, description, animal_group, cost, weight, ingredients, nutrients, nutrientRatioConstraints, lastUpdated: new Date(), typeProgress: typeProgress ? [...typeProgress] : undefined, weightProgress: weightProgress ? [...weightProgress] : undefined, milkYieldProgress: milkYieldProgress ? [...milkYieldProgress] : undefined, dateProgress: dateProgress ? [...dateProgress] : undefined, body_weight, 
//                     pregnant_phase: months_pregnant, lactating_phase: is_lactating,fat_content: fat_protein_content
//                 }
//           },
//           { new: true },
//         );
//         if (!formulation) {
//             return res.status(404).json({ message: 'error' });
//         }
//         const filteredFormulation = {
//             "_id": formulation._id,
//             "code": code,
//             "name": name,
//             "description": description ? description : "",
//             "animal_group": animal_group ? animal_group : "",
//             "cost": cost,
//             "weight": weight ? weight : 100,
//             "body_weight": body_weight ? body_weight: 0,
//             "ingredients": ingredients ? ingredients : [],
//             "nutrients": nutrients ? nutrients : [],
//             "nutrientRatioConstraints": nutrientRatioConstraints ? nutrientRatioConstraints : [],
//             "createdAt": formulation.createdAt,
//             "lastUpdated": new Date(),
//             "dmintake": formulation.dmintake ? formulation.dmintake : 0,
//             "weightProgress": formulation.weightProgress ? formulation.weightProgress : [],
//             "milkYieldProgress": formulation.milkYieldProgress ? formulation.milkYieldProgress : [],
//             "typeProgress": formulation.typeProgress ? formulation.typeProgress : [],
//             "dateProgress": formulation.dateProgress ? formulation.dateProgress : [],
//             "fat_content": formulation.fat_content ? formulation.fat_content: '',
//             "lactating_phase": formulation.lactating_phase ? formulation.lactating_phase: '',
//             "pregnant_phase": formulation.pregnant_phase ? formulation.pregnant_phase: ''
        
//         }
//         res.status(200).json({ message: 'success', formulations: filteredFormulation });
//     } catch (err) {
//         res.status(500).json({ error: err.message, message: 'error' })
//     }
// };

const updateFormulation = async (req, res) => {
  const { id } = req.params;
  let { code, name, description, animal_group, cost, weight, body_weight, ingredients, nutrients, nutrientRatioConstraints, weightProgress, milkYieldProgress, typeProgress, dateProgress, 
        fat_protein_content, is_lactating, months_pregnant } = req.body;

  // Preserve nutrientRatioConstraints structure
  nutrientRatioConstraints = (nutrientRatioConstraints || []).map(constraint => ({
    firstIngredient: constraint.firstIngredient,
    firstIngredientId: constraint.firstIngredientId,
    secondIngredient: constraint.secondIngredient,
    secondIngredientId: constraint.secondIngredientId,
    operator: constraint.operator,
    firstIngredientRatio: constraint.firstIngredientRatio,
    secondIngredientRatio: constraint.secondIngredientRatio
  }));

  try {
const formulation = await Formulation.findByIdAndUpdate(
    id,
    {
      // 1. Use $set for standard fields that should be overwritten
      $set: {
        code, name, description, animal_group, cost, weight, ingredients, nutrients,
        nutrientRatioConstraints, lastUpdated: new Date(),
        body_weight, pregnant_phase: months_pregnant,
        lactating_phase: is_lactating, fat_content: fat_protein_content
      },
      // 2. Use $push to add new elements to the end of the existing arrays
      // We use $each in case you are sending an array of new points
    $push: {
        // Only push if the value exists to avoid pushing 'null' or 'undefined'
        ...(body_weight !== undefined && { weightProgress: body_weight }),
        ...(animal_group && { typeProgress: animal_group }),
        ...(is_lactating && { milkYieldProgress: is_lactating }),
        dateProgress: new Date() 
    }
    },
    { new: true }
  );

    if (!formulation) {
      return res.status(404).json({ message: 'error' });
    }

    // ✅ Handle groupformulation update
    await upsertGroupFormulationForUpdate(formulation);

    const filteredFormulation = {
      "_id": formulation._id,
      "code": code,
      "name": name,
      "description": description || "",
      "animal_group": animal_group || "",
      "cost": cost,
      "weight": weight || 100,
      "body_weight": body_weight || 0,
      "ingredients": ingredients || [],
      "nutrients": nutrients || [],
      "nutrientRatioConstraints": nutrientRatioConstraints || [],
      "createdAt": formulation.createdAt,
      "lastUpdated": new Date(),
      "dmintake": formulation.dmintake || 0,
      "weightProgress": formulation.weightProgress || [],
      "milkYieldProgress": formulation.milkYieldProgress || [],
      "typeProgress": formulation.typeProgress || [],
      "dateProgress": formulation.dateProgress || [],
      "fat_content": formulation.fat_content || '',
      "lactating_phase": formulation.lactating_phase || '',
      "pregnant_phase": formulation.pregnant_phase || '',
      "avgGain": formulation.avgGain || ''

    };

    res.status(200).json({ message: 'success', formulations: filteredFormulation });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message, message: 'error' });
  }
};


const deleteFormulation = async (req, res) => {
    const { id } = req.params;
    try {
        // Find and delete the formulation
        const formulation = await Formulation.findByIdAndDelete(id);
        if (!formulation) {
            return res.status(404).json({ message: 'error', detail: 'Formulation not found' });
        }

        // Remove this formulation from any GroupFormulation
        const groups = await GroupFormulation.find({ formulations: id });
        for (const group of groups) {
            // Remove the formulation ID
            group.formulations = group.formulations.filter(fId => fId.toString() !== id);

            // Remove the corresponding formulationDetails
            group.formulationDetails = group.formulationDetails.filter(
                detail => detail._id.toString() !== id && detail.code !== formulation.code
            );

            if (group.formulations.length === 0) {
                // Delete the group if it has no more formulations
                await GroupFormulation.findByIdAndDelete(group._id);
            } else {
                group.lastUpdated = new Date();
                await group.save();
            }
        }

        res.status(200).json({ message: 'success', deletedFormulationId: id });
    } catch (err) {
        res.status(500).json({ error: err.message, message: 'error' });
    }
};

const getFormulationOwner = async (req, res) => {
    const { id } = req.params;
    try {
        const formulation = await Formulation.findById(id);
        const owner = formulation.collaborators.filter(item => item.access === 'owner');
        if (owner.length === 0) {
            return res.status(404).json({ message: 'error' });
        }
        res.status(200).json({ message: 'success', owner: owner[0] });
    } catch (err) {
        res.status(500).json({ error: err.message, message: 'error' })
    }
}

const addIngredients = async (req, res) => {
    const { id } = req.params;
    const { ingredients } = req.body;
    try {
        const formulation = await Formulation.findByIdAndUpdate(
          id,
          {
              $push:
                {
                    ingredients: { $each: ingredients },
                }
          },
          { new: true },
        );
        if (!formulation) {
            return res.status(404).json({ message: 'error' });
        }
        res.status(200).json({ message: 'success', addedIngredients: ingredients });
    } catch (err) {
        res.status(500).json({ error: err.message, message: 'error' })
    }
}

const addNutrients = async (req, res) => {
    const { id } = req.params;
    const { nutrients } = req.body;

    try {
        const formulation = await Formulation.findByIdAndUpdate(
          id,
          {
              $push:
                {
                    nutrients: { $each: nutrients },
                }
          },
          { new: true },
        );
        if (!formulation) {
            return res.status(404).json({ message: 'error' });
        }
        res.status(200).json({ message: 'success', addedNutrients: nutrients });
    } catch (err) {
        res.status(500).json({ error: err.message, message: 'error' })
    }
}

const removeIngredient = async (req, res) => {
    const { id, ingredient_id } = req.params;
    try {
        const formulation = await Formulation.findByIdAndUpdate(
          id,
          {
              $pull:
                {
                    ingredients: { ingredient_id: ingredient_id },
                }
          },
          { new: true },
        );
        if (!formulation) {
            return res.status(404).json({ message: 'error' });
        }
        res.status(200).json({ message: 'success' });
    } catch (err) {
        res.status(500).json({ error: err.message, message: 'error' })
    }
}

const removeNutrient = async (req, res) => {
    const { id, nutrient_id } = req.params;

    try {
        const formulation = await Formulation.findByIdAndUpdate(
          id,
          {
              $pull:
                {
                    nutrients: { nutrient_id: nutrient_id },
                }
          },
          { new: true },
        );
        if (!formulation) {
            return res.status(404).json({ message: 'error' });
        }
        res.status(200).json({ message: 'success' });
    } catch (err) {
        res.status(500).json({ error: err.message, message: 'error' })
    }
}

const validateCollaborator = async (req, res) => {
    const { formulationId, collaboratorId } = req.params;
    try {
        const formulation = await Formulation.findById(formulationId);
        if (!formulation) {
            return res.status(404).json({ message: 'error' });
        }
        // check the list of collaborators under the Formulation and see the user's access level
        const collaborator = formulation.collaborators.find(c => c.userId.toString() === collaboratorId);
        if (!collaborator) {
            return res.status(200).json({ message: 'success', access: 'notFound' });
        }
        res.status(200).json({ message: 'success', access: collaborator.access });
    } catch (err) {
        res.status(500).json({ error: err.message, message: 'error' })
    }
};


const updateCollaborator = async (req,res) => {
    const { id } = req.params;
    const { updaterId, collaboratorId, access, displayName } = req.body;
    // there should only be one owner
    if (access === 'owner') return res.status(400).json({ message: 'error' })
    try {
        const formulation = await Formulation.findById(id);
        if (!formulation) {
            return res.status(404).json({ message: 'error' });
        };
        // owner is the only one who can update
        const updater = formulation.collaborators.find(c => c.userId.toString() === updaterId);
        if (updater.access !== 'owner') {
            return res.status(401).json({ message: 'error' });
        }
        const collaborator = formulation.collaborators.find(c => c.userId.toString() === collaboratorId);
        if (!collaborator) {
            formulation.collaborators.push({ userId: collaboratorId, access: access, displayName: displayName });
            await formulation.save();
            return res.status(200).json({ message: 'success' });
        }
        if (collaborator.access === access) {
            return res.status(200).json({ message: 'success' });
        }
        collaborator.access = access;
        await formulation.save();
        res.status(200).json({ message: 'success' });
    } catch (err) {
        res.status(500).json({ error: err.message, message: 'error' })
    }
};

const removeCollaborator = async (req,res) => {
    const { formulationId, collaboratorId } = req.params;
    try {
        const formulation = await Formulation.findById(formulationId);
        if (!formulation) {
            return res.status(404).json({ message: 'error' });
        }
        // owner cannot be removed
        const toRemoveisOwner = formulation.collaborators.find(
          c => c.userId.toString() === collaboratorId && c.access === 'owner'
        );
        if (toRemoveisOwner) {
            return res.status(403).json({
                message: 'error',
            });
        }

        // remove the collaborator
        const updatedFormulation = await Formulation.findByIdAndUpdate(
          formulationId,
          {
              $pull: {
                  collaborators: { userId: collaboratorId }
              }
          },
          { new: true }
        );

        if (!updatedFormulation) {
            return res.status(404).json({ message: 'error' });
        }

        res.status(200).json({
            message: 'success',
            formulation: updatedFormulation
        });


    } catch (err) {
        res.status(500).json({ error: err.message, message: 'error' })
    }
}

const getAllTemplateFormulations = async (req, res) => {
    try {
        const formulations = await Formulation.find({ isTemplate: true });
        res.status(200).json({
            message: 'success',
            formulations
        });
    } catch (err) {
        res.status(500).json({ error: err.message, message: 'error' })
    }
}

const cloneTemplateToFormulation = async (req, res) => {
  const { id: newFormulaId } = req.params;
  const { templateId, userId } = req.body;
  try {
    // Fetch template and new formula
    const template = await Formulation.findById(templateId);
    const newFormula = await Formulation.findById(newFormulaId);
    if (!template || !newFormula) {
      return res.status(404).json({ message: 'Template or new formula not found' });
    }

    // Clone Nutrients
    const nutrientNameToUserNutrient = {};
    const clonedNutrients = [];
    const templateDescription = `From template: ${template.name} (${template.animal_group})`;
    for (const n of template.nutrients) {
      // Fetch the full nutrient document from the Nutrient collection
      let templateNutrientDoc = null;
      if (n.nutrient_id) {
        templateNutrientDoc = await Nutrient.findById(n.nutrient_id);
      }
      // Fallback: use summary if not found
      const nutrientName = templateNutrientDoc ? templateNutrientDoc.name : n.name;
      let userNutrient = await Nutrient.findOne({ name: nutrientName, user: userId });
      if (!userNutrient) {
        userNutrient = await Nutrient.create({
          abbreviation: templateNutrientDoc?.abbreviation || n.abbreviation || nutrientName.substring(0, 3).toUpperCase(),
          name: nutrientName,
          unit: templateNutrientDoc?.unit || n.unit || '',
          description: templateDescription,
          group: templateNutrientDoc?.group || n.group || '',
          source: 'user',
          user: userId
        });
      }
      nutrientNameToUserNutrient[nutrientName] = userNutrient;
      clonedNutrients.push({
        nutrient_id: userNutrient._id,
        name: userNutrient.name,
        minimum: n.minimum,
        maximum: n.maximum,
        value: n.value
      });
    }

    // Clone Ingredients
    const clonedIngredients = [];
    for (const i of template.ingredients) {
      // Fetch the full ingredient document from the Ingredient collection
      const templateIngredientDoc = await Ingredient.findById(i.ingredient_id);
      if (!templateIngredientDoc) continue;
      // Check if the user already has an ingredient with the same name
      let userIngredient = await Ingredient.findOne({ name: templateIngredientDoc.name, user: userId });
      if (!userIngredient) {
        // Build nutrients array for this ingredient using the nutrient name map
        const ingredientNutrients = [];
        if (templateIngredientDoc.nutrients && Array.isArray(templateIngredientDoc.nutrients)) {
          for (const n of templateIngredientDoc.nutrients) {
            // Find the nutrient name from the nutrient document
            let nutrientDoc = null;
            if (n.nutrient) {
              nutrientDoc = await Nutrient.findById(n.nutrient);
            }
            const nutrientName = nutrientDoc ? nutrientDoc.name : null;
            if (nutrientName && nutrientNameToUserNutrient[nutrientName]) {
              ingredientNutrients.push({
                nutrient: nutrientNameToUserNutrient[nutrientName]._id,
                value: n.value
              });
            }
          }
        }
        // Create a new ingredient for the user
        userIngredient = await Ingredient.create({
          name: templateIngredientDoc.name,
          price: templateIngredientDoc.price || 0,
          available: templateIngredientDoc.available || 1,
          group: templateIngredientDoc.group || '',
          description: templateDescription,
          source: 'user',
          user: userId,
          nutrients: ingredientNutrients
        });
      }
      clonedIngredients.push({
        ingredient_id: userIngredient._id,
        name: userIngredient.name,
        minimum: i.minimum,
        maximum: i.maximum,
        value: i.value
      });
    }

    // Clone Nutrient Ratio Constraints
    const clonedRatios = (template.nutrientRatioConstraints || []).map(r => ({ ...r.toObject?.() || r }));

    // Update the new formula
    newFormula.ingredients = clonedIngredients;
    newFormula.nutrients = clonedNutrients;
    newFormula.nutrientRatioConstraints = clonedRatios;
    await newFormula.save();

    res.status(200).json({ message: 'success', formulations: newFormula });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'error', error: err.message });
  }
};

const findGroupFormulation = async (req, res) => {
    try {
        const { formulationId } = req.body;

        // 1. Get the formulation
        const formulation = await Formulation.findById(formulationId);

        if (!formulation) {
            return res.status(404).json({ message: 'Formulation not found' });
        }

        // 2. Build group name & description
        const groupName = `${formulation.name}-${formulation.animal_group}-${formulation.body_weight}-${formulation.fat_content}-${formulation.lactating_phase}-${formulation.pregnant_phase}`;

        const groupDescription = groupName; // same as you requested

        // 3. Find existing group
        let group = await GroupFormulation.findOne({ name: groupName });

        if (group) {
            // 4A. If exists → add formulation ID (avoid duplicates)
            if (!group.formulations.some(id => id.toString() === formulation._id.toString())) {
                group.formulations.push(formulation._id);
                group.lastUpdated = new Date();
                await group.save();
            }

            return res.status(200).json({
                message: 'Formulation added to existing group',
                group
            });
        }

        // 4B. If NOT exists → create new group
        const newGroup = await GroupFormulation.create({
            name: groupName,
            description: groupDescription,
            formulations: [formulation._id],
            createdBy: formulation.collaborators?.[0]?.userId || null
        });

        return res.status(201).json({
            message: 'New group created and formulation added',
            group: newGroup
        });

    } catch (err) {
        console.error("Error in findGroupFormulation:", err);
        res.status(500).json({
            message: 'error',
            error: err.message
        });
    }
};


 // Categorize body weight
const getBodyWeightRange = (bw) => {
    if (bw < 100) return '0-100';
    if (bw < 150) return '100-150';
    if (bw < 200) return '150-200';
    if (bw < 250) return '200-250';
    if (bw < 300) return '250-300';
    if (bw < 350) return '300-350';
    if (bw < 400) return '350-400';
    if (bw < 450) return '400-450';
    if (bw < 500) return '450-500';
    if (bw < 550) return '500-550';
    if (bw < 600) return '550-600';
    if (bw < 650) return '600-650';
    if (bw < 700) return '650-700';
    if (bw < 750) return '700-750';
    if (bw < 800) return '750-800';
    if (bw < 850) return '800-850';
    if (bw < 900) return '850-900';
    return '900+';
};

    // Categorize pregnancy phase
    const getPregnancyCategory = (months) => {
        if (months === null || months === undefined || months === '' || months=== 0) return 'none';

        const m = parseInt(months);
        if (m >= 1 && m <= 8) return 'Early Pregnancy';
        if (m >= 9 && m <= 11) return 'Late Pregnancy';

        return 'none';
    };
const generateGroupDescription = (formulation, bwCategory, pregnancyCategory) => {
  let text = `Formulation for ${formulation.animal_group || 'animals'}`;
  if (bwCategory) text += ` (${bwCategory} kg).`;
  else text += `.`;

  // Status sentence
  const hasLactation = formulation.lactating_phase && formulation.lactating_phase !== 'Not Lactating';
  const hasPregnancy = pregnancyCategory && pregnancyCategory !== 'Not Pregnant';
  
  if (hasLactation || hasPregnancy) {
    text += ` Currently`;
    if (hasLactation) text += ` in ${formulation.lactating_phase}`;
    if (hasLactation && hasPregnancy) text += ` and`;
    if (hasPregnancy) text += ` ${pregnancyCategory} pregnant.`;
    else text += `.`;
  }

  // Targets sentence
  if (formulation.avgGain || formulation.fat_content) {
    text += ` Targeting`;
    if (formulation.avgGain) text += ` an ADG of ${formulation.avgGain} kg`;
    if (formulation.avgGain && formulation.fat_content) text += ` and`;
    if (formulation.fat_content) text += ` milk fat of ${formulation.fat_content}%.`;
    else text += `.`;
  }

  return text.trim().replace(/\s+/g, ' '); // Cleans up any double spaces
};

// Add Formulation in groupformulation.
const upsertGroupFormulation = async (formulation) => {
  const bwCategory = getBodyWeightRange(formulation.body_weight);
  const pregnancyCategory = getPregnancyCategory(formulation.pregnant_phase);
  const avgGain = formulation.avgGain || '';
  const groupDescription = generateGroupDescription(formulation, bwCategory, pregnancyCategory);
  const nameParts = [
    formulation.animal_group,
    bwCategory ? `Wt:${bwCategory}` : null,
    formulation.fat_content ? `Fat:${formulation.fat_content}` : null,
    formulation.lactating_phase && formulation.lactating_phase !== 'Not Lactating' ? formulation.lactating_phase : null,
    pregnancyCategory !== 'Not Pregnant' ? pregnancyCategory : null, // Assuming you have a default like this
    avgGain ? `ADG:${avgGain}` : null
  ];

  // 2. Filter out the nulls/empties and join with a clean separator
  const groupName = nameParts.filter(Boolean).join(' | ');
  let group = await GroupFormulation.findOne({ name: groupName });
  const formulationDetail = {
    code: formulation.code,
    name: formulation.name,
    description: formulation.description,
    animal_group: formulation.animal_group || '',
    weight: formulation.weight || 100,
    body_weight: formulation.body_weight || 0,
    dmintake: formulation.dmintake || 0,
    nutrients: formulation.nutrients || [],
    fat_content: formulation.fat_content || 0,
    lactating_phase: formulation.lactating_phase || false,
    pregnant_phase: formulation.pregnant_phase || 0,
    weightProgress: formulation.weightProgress || [],
    origNutrientTargets: formulation.origNutrientTargets || [],
    milkYieldProgress: formulation.milkYieldProgress || [],
    typeProgress: formulation.typeProgress || [],
    dateProgress: formulation.dateProgress || [],
    collaborators: formulation.collaborators || [],
    avgGain: formulation.avgGain || ''
  };
  if (group) {
    // Add formulation ID if not exists
    if (!group.formulations.some(id => id.toString() === formulation._id.toString())) {
      group.formulations.push(formulation._id);
      group.formulationDetails.push(formulationDetail);
      group.lastUpdated = new Date();
      await group.save();
    }
    return group;
  }

  // Create new group with the formulation detail included
    return await GroupFormulation.findOneAndUpdate(
        { name: groupName }, // Search criteria
        { 
        $addToSet: { 
            formulations: formulation._id,
            formulationDetails: formulationDetail 
        },
        $set: { 
            lastUpdated: new Date(),
            description: groupDescription
        },
        $setOnInsert: { 
            createdBy: formulation.collaborators?.[0]?.userId || null 
        }
        },
        { upsert: true, new: true } // Create if doesn't exist, return the updated doc
    );
};

const getAllGroupFormulations = async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ message: 'user_id required' });

    // 1. Convert to ObjectId to avoid casting errors
    const searchId = new mongoose.Types.ObjectId(user_id);

    // 2. Find Formulations where the user is a collaborator
    // Note: We use "collaborators.userId" to match your object structure
    const userFormulations = await Formulation.find({ 
      "collaborators.userId": searchId 
    }).select('_id');

    const formIds = userFormulations.map(f => f._id);

    // 3. Find Groups containing those specific formulations
    const groups = await GroupFormulation.find({
      formulations: { $in: formIds }
    })
    .populate({
      path: 'formulations',
      // Optional: If you want to only show the user the formulations they 
      // actually have access to within a group:
      match: { "collaborators.userId": searchId },
      select: 'code name animal_group body_weight fat_content collaborators', 
    })
    .populate('createdBy', 'displayName')
    .sort({ createdAt: -1 });

    res.status(200).json({
      message: 'success',
      groupFormulations: groups,
    });
  } catch (err) {
    console.error('Final Query Error:', err);
    res.status(500).json({ message: 'error', error: err.message });
  }
};

const upsertGroupFormulationForUpdate = async (formulation) => {
  const bwCategory = getBodyWeightRange(formulation.body_weight);
  const pregnancyCategory = getPregnancyCategory(formulation.pregnant_phase);
  const avgGain = formulation.avgGain || '';
  const groupDescription = generateGroupDescription(formulation, bwCategory, pregnancyCategory);
  const nameParts = [
    formulation.animal_group,
    bwCategory ? `Wt:${bwCategory}` : null,
    formulation.fat_content ? `Fat:${formulation.fat_content}` : null,
    formulation.lactating_phase && formulation.lactating_phase !== 'Not Lactating' ? formulation.lactating_phase : null,
    pregnancyCategory !== 'Not Pregnant' ? pregnancyCategory : null, // Assuming you have a default like this
    avgGain ? `ADG:${avgGain}` : null
  ];

  // 2. Filter out the nulls/empties and join with a clean separator
  const newGroupName = nameParts.filter(Boolean).join(' | ');

  // Copy the formulation details to store in the group
  const formulationDetail = {
    _id: formulation._id,
    code: formulation.code,
    name: formulation.name,
    description: formulation.description || '',
    animal_group: formulation.animal_group || '',
    weight: formulation.weight || 100,
    body_weight: formulation.body_weight || 0,
    dmintake: formulation.dmintake || 0,
    nutrients: formulation.nutrients || [],
    fat_content: formulation.fat_content || 0,
    lactating_phase: String(formulation.lactating_phase || 'none'),
    pregnant_phase: String(formulation.pregnant_phase || 'none'),
    weightProgress: formulation.weightProgress || [],
    milkYieldProgress: formulation.milkYieldProgress || [],
    typeProgress: formulation.typeProgress || [],
    dateProgress: formulation.dateProgress || [],
    origNutrientTargets: formulation.origNutrientTargets || [],
    avgGain: formulation.avgGain || '',
  };

  // Find the current group the formulation belongs to
  let currentGroups = await GroupFormulation.find({ formulations: formulation._id });
  let currentGroup = currentGroups[0];

  // Check if the formulation moved to a different group
  if (!currentGroup || currentGroup.name !== newGroupName) {
    // Remove from old group if exists
    if (currentGroup) {
      currentGroup.formulations = currentGroup.formulations.filter(
        (id) => id.toString() !== formulation._id.toString()
      );
      currentGroup.formulationDetails = currentGroup.formulationDetails.filter(
        (detail) => detail._id.toString() !== formulation._id.toString()
      );

      // Delete the old group if empty
      if (currentGroup.formulations.length === 0) {
        await GroupFormulation.findByIdAndDelete(currentGroup._id);
      } else {
        currentGroup.lastUpdated = new Date();
        await currentGroup.save();
      }
    }

    // Add to new group or create it
    let newGroup = await GroupFormulation.findOne({ name: newGroupName });
    if (!newGroup) {
      newGroup = await GroupFormulation.create({
        name: newGroupName,
        description: groupDescription,
        formulations: [formulation._id],
        formulationDetails: [formulationDetail],

        createdBy: formulation.collaborators?.[0]?.userId || null,
      });
    } else {
      if (!newGroup.formulations.some(id => id.toString() === formulation._id.toString())) {
        newGroup.formulations.push(formulation._id);
        newGroup.formulationDetails.push(formulationDetail);
        newGroup.lastUpdated = new Date();
        await newGroup.save();
      }
    }
  }
};
const getGroupFormulationById = async (req, res) => {
  const { id } = req.params;
  try {
    const groupFormulation = await GroupFormulation.findById(id)
      .populate('formulations') // populate formulations if you want full data
      .populate('createdBy', 'displayName email'); // optional: populate creator info

    if (!groupFormulation) {
      return res.status(404).json({ message: 'GroupFormulation not found' });
    }
    
    res.status(200).json({ message: 'success', groupFormulation });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'error', error: err.message });
  }
};

const getGroupFormulationFormulations = async (req, res) => {
  const { groupFormulationId, userId } = req.params;

  try {
    // 1. Fetch the group formulation
    const group = await GroupFormulation.findById(groupFormulationId);
    if (!group) {
      return res.status(404).json({ message: 'GroupFormulation not found' });
    }


    // 2. Filter formulations where the user is either owner or in collaborators
    const accessibleFormulations = (group.formulationDetails || []).filter((form) => {
      const isOwner = (form.collaborators || []).some(c => c.userId.toString() === userId && c.access === 'owner');
      console.log("Is Owner: ", group.formulationDetails)
      const hasAccess = (form.collaborators || []).some(c => c.userId.toString() === userId);
      return isOwner || hasAccess;
    });
    // 3. Map to only name and description
    const result = accessibleFormulations.map(f => ({
      id: f._id,
      name: f.name,
      description: f.description,
      weight: f.body_weight
    }));

    return res.status(200).json({ formulations: result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};
export {
    createFormulation,
    getAllFormulations,
    getAllSpecialFormulations,
    getFormulation,
    getFormulationByFilters,
    updateFormulation,
    deleteFormulation,
    getFormulationOwner,
    addIngredients,
    addNutrients,
    removeIngredient,
    removeNutrient,
    validateCollaborator,
    updateCollaborator,
    removeCollaborator,
    getAllTemplateFormulations,
    cloneTemplateToFormulation,
    getCowFormulation,
    getCarabaoFormulation,
    getBullFormulation,
    getAllGroupFormulations,
    getGroupFormulationById,
    getGroupFormulationFormulations,
};