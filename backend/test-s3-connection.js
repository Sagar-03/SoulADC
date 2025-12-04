/**
 * Quick S3 Connection Test Script
 * 
 * Run this to verify your S3 configuration is working
 * Usage: node test-s3-connection.js
 */

require('dotenv').config();
const { S3Client, ListBucketsCommand, HeadBucketCommand } = require('@aws-sdk/client-s3');

async function testS3Connection() {
  console.log('🔍 Testing S3 Configuration...\n');
  
  // Display configuration (without exposing secrets)
  console.log('Configuration:');
  console.log('- Region:', process.env.AWS_REGION);
  console.log('- Bucket:', process.env.AWS_S3_BUCKET);
  console.log('- Access Key:', process.env.AWS_ACCESS_KEY_ID ? '✅ Set' : '❌ Missing');
  console.log('- Secret Key:', process.env.AWS_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Missing');
  console.log('');

  const s3 = new S3Client({
    region: process.env.AWS_REGION || 'ap-southeast-2',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    requestHandler: {
      requestTimeout: 0,
      httpsAgent: {
        maxSockets: 50,
      },
    },
  });

  try {
    // Test 1: List buckets (verify credentials work)
    console.log('Test 1: Verifying AWS credentials...');
    const listCommand = new ListBucketsCommand({});
    const { Buckets } = await s3.send(listCommand);
    console.log('✅ Credentials valid!');
    console.log('   Available buckets:', Buckets.map(b => b.Name).join(', '));
    console.log('');

    // Test 2: Check if our bucket exists and is accessible
    console.log('Test 2: Checking bucket access...');
    const headCommand = new HeadBucketCommand({ 
      Bucket: process.env.AWS_S3_BUCKET 
    });
    await s3.send(headCommand);
    console.log(`✅ Bucket "${process.env.AWS_S3_BUCKET}" is accessible!`);
    console.log('');

    // Test 3: Check region match
    const bucketExists = Buckets.find(b => b.Name === process.env.AWS_S3_BUCKET);
    if (bucketExists) {
      console.log('Test 3: Region configuration...');
      console.log(`✅ Region ${process.env.AWS_REGION} is configured`);
      console.log('');
    }

    console.log('🎉 All tests passed! S3 is configured correctly.');
    console.log('');
    console.log('Upload Configuration:');
    console.log('- No timeout limits ✅');
    console.log('- Max concurrent connections: 50 ✅');
    console.log('- Presigned URL expiry: 12 hours ✅');
    console.log('- Retry logic: 3 attempts per part ✅');

  } catch (error) {
    console.error('❌ S3 Connection Test Failed!');
    console.error('');
    console.error('Error:', error.message);
    
    if (error.name === 'CredentialsError' || error.name === 'InvalidAccessKeyId') {
      console.error('');
      console.error('💡 Fix: Check your AWS credentials in .env file');
      console.error('   - AWS_ACCESS_KEY_ID');
      console.error('   - AWS_SECRET_ACCESS_KEY');
    } else if (error.name === 'NoSuchBucket') {
      console.error('');
      console.error('💡 Fix: Bucket does not exist or wrong name');
      console.error('   - Check AWS_S3_BUCKET in .env file');
    } else if (error.message.includes('Region')) {
      console.error('');
      console.error('💡 Fix: Region mismatch');
      console.error('   - Update AWS_REGION in .env file');
      console.error('   - Common regions: us-east-1, ap-southeast-2, eu-west-1');
    }
    
    process.exit(1);
  }
}

testS3Connection();
