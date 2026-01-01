const { CopyObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const s3 = require("../config/s3.js");

/**
 * Reorganizes mock images from temp folder to proper mockId-based folder structure
 * @param {string} mockId - The ID of the created mock
 * @param {Array} scenarios - Array of scenarios with images
 * @returns {Object} - Updated scenarios with new S3 keys
 */
async function reorganizeMockImages(mockId, scenarios) {
  const updatedScenarios = [];

  for (const scenario of scenarios) {
    const updatedScenario = { ...scenario };
    
    // Reorganize scenario images
    if (scenario.images && scenario.images.length > 0) {
      const updatedScenarioImages = [];
      
      for (const oldKey of scenario.images) {
        // Only reorganize if it's in temp folder
        if (oldKey.includes('/temp/')) {
          try {
            // Extract filename from old key
            const fileName = oldKey.split('/').pop();
            
            // Create new key with proper structure: mock-questions/{mockId}/scenarios/{scenarioId}/
            const newKey = `mock-questions/${mockId}/scenarios/${scenario._id}/${fileName}`;
            
            // Copy object to new location
            await s3.send(new CopyObjectCommand({
              Bucket: process.env.AWS_S3_BUCKET,
              CopySource: `${process.env.AWS_S3_BUCKET}/${oldKey}`,
              Key: newKey,
            }));
            
            // Delete old object
            await s3.send(new DeleteObjectCommand({
              Bucket: process.env.AWS_S3_BUCKET,
              Key: oldKey,
            }));
            
            console.log(`✅ Moved scenario image from ${oldKey} to ${newKey}`);
            updatedScenarioImages.push(newKey);
          } catch (error) {
            console.error(`❌ Error moving scenario image ${oldKey}:`, error);
            // Keep old key if move fails
            updatedScenarioImages.push(oldKey);
          }
        } else {
          // Keep non-temp keys as-is
          updatedScenarioImages.push(oldKey);
        }
      }
      
      updatedScenario.images = updatedScenarioImages;
    }
    
    // Reorganize question images
    if (scenario.questions && scenario.questions.length > 0) {
      const updatedQuestions = [];
      
      for (const question of scenario.questions) {
        const updatedQuestion = { ...question };
        
        if (question.images && question.images.length > 0) {
          const updatedQuestionImages = [];
          
          for (const oldKey of question.images) {
            // Only reorganize if it's in temp folder
            if (oldKey.includes('/temp/')) {
              try {
                // Extract filename from old key
                const fileName = oldKey.split('/').pop();
                
                // Create new key: mock-questions/{mockId}/questions/{scenarioId}-{questionId}/
                const newKey = `mock-questions/${mockId}/questions/${scenario._id}-${question._id}/${fileName}`;
                
                // Copy object to new location
                await s3.send(new CopyObjectCommand({
                  Bucket: process.env.AWS_S3_BUCKET,
                  CopySource: `${process.env.AWS_S3_BUCKET}/${oldKey}`,
                  Key: newKey,
                }));
                
                // Delete old object
                await s3.send(new DeleteObjectCommand({
                  Bucket: process.env.AWS_S3_BUCKET,
                  Key: oldKey,
                }));
                
                console.log(`✅ Moved question image from ${oldKey} to ${newKey}`);
                updatedQuestionImages.push(newKey);
              } catch (error) {
                console.error(`❌ Error moving question image ${oldKey}:`, error);
                // Keep old key if move fails
                updatedQuestionImages.push(oldKey);
              }
            } else {
              // Keep non-temp keys as-is
              updatedQuestionImages.push(oldKey);
            }
          }
          
          updatedQuestion.images = updatedQuestionImages;
        }
        
        updatedQuestions.push(updatedQuestion);
      }
      
      updatedScenario.questions = updatedQuestions;
    }
    
    updatedScenarios.push(updatedScenario);
  }
  
  return updatedScenarios;
}

module.exports = { reorganizeMockImages };
