import React from 'react';
import { View, StyleSheet, ScrollView, Text, Pressable } from 'react-native';

interface Props {
  children: React.ReactNode;
}
interface State {
  error: Error | null;
}

/**
 * Catches render-time crashes and surfaces them on screen instead of
 * failing silently. Critical for diagnosing issues on preview/production
 * builds (which have no Expo redbox overlay).
 */
export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  private handleRetry = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (error) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>{error.message}</Text>
          <Pressable style={styles.retry} onPress={this.handleRetry}>
            <Text style={styles.retryText}>Tap to retry</Text>
          </Pressable>
          <Text style={styles.stackLabel}>Stack trace:</Text>
          <ScrollView style={styles.scroll}>
            <Text style={styles.stack}>{error.stack}</Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#0A0A0F',
    justifyContent: 'center',
  },
  title: {
    color: '#FF4D4F',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  message: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 16,
  },
  retry: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#00C896',
    marginBottom: 16,
  },
  retryText: {
    color: '#0A0A0F',
    fontWeight: '700',
  },
  stackLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 6,
  },
  scroll: {
    maxHeight: 280,
  },
  stack: {
    color: '#BBBBBB',
    fontSize: 10,
    fontFamily: 'monospace',
  },
});
